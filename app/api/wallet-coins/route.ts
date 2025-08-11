import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE = "https://public-api-v2.bags.fm/api/v1";
const API_KEY = "bags_prod_WLmpt-ZMCdFmN3WsFBON5aJnhYMzkwAUsyIJLZ3tORY";

// Простой in-memory кеш на 60 секунд
const cache = new Map<string, { data: any; expires: number }>();

async function bagsApi(path: string) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 
        "x-api-key": API_KEY, 
        "accept": "application/json" 
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });
    const raw = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${raw.slice(0,200)}` };
    try { 
      return { ok: true, json: JSON.parse(raw) }; 
    } catch { 
      return { ok: false, error: `Invalid JSON: ${raw.slice(0,200)}` }; 
    }
  } catch (e: any) {
    return { ok: false, error: `Fetch failed: ${String(e?.message || e)}` };
  }
}

// Батчинг запросов по 10 штук
async function processInBatches<T, R>(
  items: T[], 
  processor: (item: T) => Promise<R>, 
  batchSize = 10
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").trim();
    const debug = url.searchParams.get("debug") === "1";
    
    if (!wallet) return NextResponse.json({ ok: false, error: "Missing ?wallet" }, { status: 400 });
    
    // Валидация адреса
    if (wallet.length < 32 || wallet.length > 44) {
      return NextResponse.json({ ok: false, error: "Invalid wallet address format" }, { status: 400 });
    }

    // Проверяем кеш
    const cacheKey = wallet;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({ ok: true, data: cached.data, cached: true });
    }

    // 1) Получаем все токены кошелька
    const walletRes = await bagsApi(`/token-launch/wallet?wallet=${encodeURIComponent(wallet)}`);
    if (!walletRes.ok) {
      return NextResponse.json({ ok: false, error: walletRes.error }, { status: 502 });
    }

    const tokens = walletRes.json?.response || [];
    if (!Array.isArray(tokens) || tokens.length === 0) {
      const emptyResult = [];
      cache.set(cacheKey, { data: emptyResult, expires: Date.now() + 60000 });
      return NextResponse.json({ ok: true, data: emptyResult });
    }

    // Получаем уникальные mint'ы
    const uniqueMints = [...new Set(tokens.map((t: any) => t.tokenMint).filter(Boolean))];
    
    const debugErrors: string[] = [];
    const coinRows: any[] = [];

    // 2) Для каждого mint получаем информацию о создателях
    const processCreator = async (mint: string) => {
      try {
        const creatorRes = await bagsApi(`/token-launch/creator/v2?tokenMint=${encodeURIComponent(mint)}`);
        if (!creatorRes.ok) {
          debugErrors.push(`${mint}: ${creatorRes.error}`);
          return null;
        }

        const creators = Array.isArray(creatorRes.json?.response) ? creatorRes.json.response : [];
        
        // Ищем запись для нашего кошелька
        const walletCreator = creators.find((c: any) => c.wallet === wallet);
        if (!walletCreator) {
          debugErrors.push(`${mint}: wallet not found in creators list`);
          return null;
        }

        return {
          mint,
          role: walletCreator.isCreator ? "creator" : "fee-share",
          twitter: walletCreator.twitterUsername || null,
          username: walletCreator.username || null,
          royaltyPct: typeof walletCreator.royaltyBps === "number" ? walletCreator.royaltyBps / 100 : null,
        };
      } catch (e: any) {
        debugErrors.push(`${mint}: ${e.message}`);
        return null;
      }
    };

    // Обрабатываем батчами по 10
    const results = await processInBatches(uniqueMints, processCreator, 10);
    
    // Фильтруем успешные результаты
    const validResults = results.filter(Boolean);
    
    // Сортируем: сначала creators, потом fee-share
    validResults.sort((a, b) => {
      if (a.role === "creator" && b.role !== "creator") return -1;
      if (a.role !== "creator" && b.role === "creator") return 1;
      return 0;
    });

    // Кешируем результат на 60 секунд
    cache.set(cacheKey, { data: validResults, expires: Date.now() + 60000 });

    const response: any = { ok: true, data: validResults };
    if (debug && debugErrors.length > 0) {
      response.debug = debugErrors;
    }

    return NextResponse.json(response);
  } catch (e: any) {
    return NextResponse.json({ 
      ok: false, 
      error: e?.message || String(e) 
    }, { status: 500 });
  }
}