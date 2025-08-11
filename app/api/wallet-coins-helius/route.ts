import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ""}`;

async function rpc(method: string, params: any) {
  if (!process.env.HELIUS_API_KEY) throw new Error("Missing HELIUS_API_KEY");
  const r = await fetch(HELIUS, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "bags", method, params })
  });
  const raw = await r.text();
  if (!r.ok) throw new Error(`${r.status}: ${raw.slice(0,200)}`);
  let j: any; try { j = JSON.parse(raw); } catch { throw new Error(`Invalid JSON: ${raw.slice(0,200)}`); }
  if (j.error) throw new Error(j.error.message || "RPC error");
  return j.result;
}

// Нормализуем ответ DAS (часто: { items: [...] })
const itemsOf = (res: any) => Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").trim();
    if (!wallet) return NextResponse.json({ ok:false, error:"Missing ?wallet" }, { status:400 });

    // 1) Поиск активов, где кошелёк — creator (фанджибл-токены)
    const s1 = await rpc("searchAssets", {
      creatorAddress: wallet,
      page: 1,
      limit: 500,
    });

    // 2) Активы, где кошелёк — update authority (часто совпадает с "создателем")
    const s2 = await rpc("getAssetsByAuthority", {
      authorityAddress: wallet,
      page: 1,
      limit: 500
    });

    // Объединяем, фильтруем на фанджиблы
    const all = [...itemsOf(s1), ...itemsOf(s2)];
    const seen = new Set<string>();
    const coins = [];

    for (const a of all) {
      // Распаковка удобных полей
      const iface = a?.interface || a?.interfaceType;
      if (iface !== "FungibleToken") continue;

      const mint = a?.id || a?.mint || a?.token?.mint;
      if (!mint || seen.has(mint)) continue;
      seen.add(mint);

      const name = a?.content?.metadata?.name ?? a?.token_info?.name ?? null;
      const symbol = a?.token_info?.symbol ?? a?.content?.metadata?.symbol ?? null;
      const img = a?.content?.links?.image ?? null;

      // Пытаемся понять роль — creator/authority (эвристики)
      const creators: string[] = (a?.creators || a?.content?.metadata?.creators || []).map((c: any) => c?.address || c).filter(Boolean);
      const updateAuth = a?.authorities?.[0]?.address || a?.authority || a?.updateAuthority;
      const role = creators.includes(wallet) ? "creator" : (updateAuth === wallet ? "authority" : "unknown");

      coins.push({ mint, name, symbol, image: img, role });
    }

    return NextResponse.json({ ok:true, data: coins });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || String(e) }, { status:500 });
  }
}