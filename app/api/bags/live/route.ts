import { NextResponse } from 'next/server';
import { fetchJSON, getCache, setCache, withRetry } from '@/src/lib/http';

const HELIUS_KEY = process.env.HELIUS_API_KEY!;
const PROGRAMS = (process.env.BAGS_PROGRAM_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

const RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'; // SPL Token Program
const MINT_SPACE = 82; // bytes for Mint account

type RpcReq = { jsonrpc: '2.0'; id: string|number; method: string; params?: any[] };

async function rpc<T = any>(method: string, params: any[]): Promise<T> {
  const body: RpcReq = { jsonrpc: '2.0', id: Date.now(), method, params };
  return withRetry(() => fetchJSON<T>(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
}

type SigInfo = { signature: string; blockTime?: number };
type ParsedTx = {
  blockTime?: number;
  meta?: { innerInstructions?: any[] };
  transaction?: { message?: { instructions?: any[], accountKeys?: { pubkey: string }[] } };
};

function sinceEpoch(secAgo: number) { return Math.floor(Date.now()/1000) - secAgo; }

async function discoverMints24h(limitPerProgram = 400): Promise<{mint: string; time: number}[]> {
  const since = sinceEpoch(24 * 3600);
  const out = new Map<string, number>();

  for (const prog of PROGRAMS) {
    // page signatures until older than 24h or limit reached
    let before: string | undefined = undefined;
    let collected = 0;
    while (collected < limitPerProgram) {
      const sigs: SigInfo[] = await rpc('getSignaturesForAddress', [prog, { limit: 1000, before }]);
      if (!sigs.length) break;
      for (const s of sigs) {
        if (!s.blockTime || s.blockTime < since) { before = s.signature; continue; }
        // fetch parsed tx
        const [tx]: ParsedTx[] = await rpc('getParsedTransactions', [[s.signature], { maxSupportedTransactionVersion: 0 }]);
        const bt = tx?.blockTime ?? s.blockTime!;
        // find inner system createAccount -> owner = TOKEN_PROGRAM && space=82 => newAccount = mint pubkey
        const ii = tx?.meta?.innerInstructions || [];
        for (const group of ii) {
          const ins = group?.instructions || [];
          for (const inst of ins) {
            if (inst?.program !== 'system' || inst?.parsed?.type !== 'createAccount') continue;
            const info = inst.parsed?.info;
            if (info?.owner === TOKEN_PROGRAM && Number(info?.space) === MINT_SPACE && typeof info?.newAccount === 'string') {
              const mint = info.newAccount as string;
              if (!out.has(mint)) out.set(mint, bt);
            }
          }
        }
        collected++;
        if (collected >= limitPerProgram) break;
      }
      // advance pagination
      before = sigs[sigs.length - 1]?.signature;
      // if oldest page already older than since — we can stop
      if (sigs[sigs.length - 1]?.blockTime && sigs[sigs.length - 1].blockTime! < since) break;
    }
  }

  return Array.from(out.entries()).map(([mint, time]) => ({ mint, time })).sort((a,b)=>b.time-a.time);
}

// Dexscreener types are intentionally loose to be resilient
type DexPair = {
  pairAddress?: string;
  chainId?: string;
  dexId?: string;
  baseToken?: { address: string; symbol?: string; };
  quoteToken?: { address: string; symbol?: string; };
  priceUsd?: string;
  priceChange?: { h24?: number } | { h24?: string } | any;
  volume?: { h24?: number } | { h24?: string } | any;
  liquidity?: { usd?: number } | { usd?: string } | any;
  fdv?: number | string;
  url?: string;
};

async function loadMarketsForMints(mints: string[]): Promise<DexPair[]> {
  // query each mint independently to avoid unrelated pairs
  const results: DexPair[] = [];
  const chunks = Array.from({length: Math.ceil(mints.length/20)}, (_,i)=> mints.slice(i*20, (i+1)*20));
  for (const chunk of chunks) {
    await Promise.all(chunk.map(async (mint) => {
      try {
        const data = await withRetry(() => fetchJSON<{ pairs?: DexPair[] }>(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, {}, 8000));
        const pairs = data?.pairs || [];
        // keep only markets where baseToken === our mint (defensive)
        for (const p of pairs) {
          if (p?.baseToken?.address === mint) results.push(p);
        }
      } catch { /* ignore this mint */ }
    }));
  }
  return results;
}

function num(v: any): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v.replace(/[$,]/g,'')) || 0;
  return 0;
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const nocache = searchParams.get('nocache') === '1';

  const CACHE_KEY = 'bags_live_v3';
  const TTL = 60_000; // 60s server cache

  if (!nocache) {
    const cached = getCache<any>(CACHE_KEY);
    if (cached) return NextResponse.json(cached, { headers: { 'x-cache': 'HIT' } });
  }

  try {
    // 1) discover mint accounts created by BAGS programs in last 24h
    const discovered = await discoverMints24h(350); // per program safety cap
    const mints = discovered.map(d => d.mint);
    // 2) load markets strictly for those mints
    const markets = mints.length ? await loadMarketsForMints(mints) : [];

    // aggregate
    const byMint = new Map<string, DexPair[]>();
    for (const p of markets) {
      const mint = p?.baseToken?.address!;
      if (!byMint.has(mint)) byMint.set(mint, []);
      byMint.get(mint)!.push(p);
    }

    const activeTokens = byMint.size;
    let volume24h = 0;
    let totalLiq = 0;

    const bestPerMint: DexPair[] = [];
    for (const mint of byMint.keys()) {
      const arr = byMint.get(mint)!;
      // choose market with highest liquidity
      arr.sort((a,b)=> num(b.liquidity?.usd) - num(a.liquidity?.usd));
      const best = arr[0];
      bestPerMint.push(best);
      volume24h += num(best.volume?.h24 ?? best['volume24h']);
      totalLiq += num(best.liquidity?.usd);
    }

    // top by FDV
    bestPerMint.sort((a,b)=> num(b.fdv) - num(a.fdv));
    const top = bestPerMint.slice(0, 10).map(p => ({
      pair: `${p.baseToken?.symbol ?? ''}/${p.quoteToken?.symbol ?? ''}`.replace(/^\//,''),
      priceUsd: num(p.priceUsd),
      change24h: typeof p.priceChange?.h24 === 'string' ? Number(p.priceChange?.h24) : (p.priceChange?.h24 ?? null),
      vol24hUsd: num(p.volume?.h24 ?? p['volume24h']),
      liquidityUsd: num(p.liquidity?.usd),
      fdvUsd: num(p.fdv),
      link: p.url || null,
      chain: p.chainId,
      dex: p.dexId
    }));

    const payload = {
      lastUpdated: Date.now(),
      stats: {
        totalTokens24h: discovered.length,
        activeTokens,
        volume24hUsd: volume24h,
        totalLiquidityUsd: totalLiq,
      },
      top,
      note: `Data via Helius (program-based discovery) + Dexscreener (markets).`,
    };

    setCache(CACHE_KEY, payload, TTL);
    return NextResponse.json(payload, { headers: { 'x-cache': 'MISS' } });
  } catch (e: any) {
    // try to serve stale result to avoid flicker
    const stale = getCache<any>('bags_live_v3');
    if (stale) return NextResponse.json(stale, { headers: { 'x-cache': 'STALE' } });
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}