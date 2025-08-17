import { NextResponse } from 'next/server';
import { rpc, rpcBatchGetParsedTransactions } from '@/src/lib/solana';
import { getCache, setCache, num, sleep } from '@/src/lib/http';

const PROGRAMS = (process.env.BAGS_PROGRAM_IDS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const MINT_SPACE = 82;
const CACHE_KEY = 'bags_live_v4';
const TTL = 60_000;

export const dynamic = 'force-dynamic';

type Sig = { signature: string; blockTime?: number };

function sinceSec(s: number) { return Math.floor(Date.now()/1000) - s; }

async function getProgramSigs24h(prog: string, cap = 1500): Promise<Sig[]> {
  const out: Sig[] = [];
  let before: string | undefined = undefined;
  const since = sinceSec(24*3600);

  while (out.length < cap) {
    const page: Sig[] = await rpc('getSignaturesForAddress', [prog, { limit: 1000, before }]);
    if (!page.length) break;
    for (const s of page) {
      if (!s.blockTime || s.blockTime < since) { before = s.signature; continue; }
      out.push(s);
    }
    before = page[page.length - 1]?.signature;
    if (page[page.length - 1]?.blockTime && page[page.length - 1].blockTime! < since) break;
  }
  return out;
}

function chunk<T>(arr: T[], n: number) {
  const out: T[][] = [];
  for (let i=0;i<arr.length;i+=n) out.push(arr.slice(i,i+n));
  return out;
}

async function discoverMints24h(): Promise<{ mint: string; time: number }[]> {
  const seen = new Map<string, number>();
  const allSigs: Sig[] = [];

  // collect signatures for all programs
  for (const p of PROGRAMS) {
    const sigs = await getProgramSigs24h(p, 1500);
    allSigs.push(...sigs);
  }

  if (!allSigs.length) return [];

  // batch parse transactions (100 per RPC)
  const batches = chunk(allSigs, 100);
  for (const b of batches) {
    const txs = await rpcBatchGetParsedTransactions(b.map(s=>s.signature));
    for (let i=0;i<txs?.length;i++) {
      const tx = txs[i];
      const bt = tx?.blockTime || b[i].blockTime || 0;

      const groups = tx?.meta?.innerInstructions || [];
      for (const gr of groups) {
        const ins = gr?.instructions || [];
        for (const inst of ins) {
          // system.createAccount → owner = token program, space >= 82
          if (inst?.program === 'system' && inst?.parsed?.type === 'createAccount') {
            const info = inst?.parsed?.info;
            if (info?.owner === TOKEN_PROGRAM && Number(info?.space) >= MINT_SPACE && typeof info?.newAccount === 'string') {
              const mint = info.newAccount as string;
              if (!seen.has(mint)) seen.set(mint, bt);
            }
          }
        }
      }

      // дополнительно ловим initializeMint на верхнем уровне
      const top = tx?.transaction?.message?.instructions || [];
      for (const inst of top) {
        if (inst?.programId?.toString?.() === TOKEN_PROGRAM && inst?.parsed?.type === 'initializeMint') {
          const mint = inst?.parsed?.info?.mint;
          if (typeof mint === 'string' && !seen.has(mint)) seen.set(mint, bt);
        }
      }
    }
    // be gentle to RPC
    await sleep(120);
  }

  return Array.from(seen.entries())
    .map(([mint,time])=>({mint,time}))
    .sort((a,b)=>b.time-a.time);
}

type DexPair = {
  url?: string;
  chainId?: string;
  dexId?: string;
  baseToken?: { address: string; symbol?: string };
  quoteToken?: { address: string; symbol?: string };
  priceUsd?: string;
  priceChange?: { h24?: number|string } | any;
  volume?: { h24?: number|string } | any;
  liquidity?: { usd?: number|string } | any;
  fdv?: number|string;
};

async function loadMarketsBulk(mints: string[]): Promise<DexPair[]> {
  const results: DexPair[] = [];
  const chunks = chunk(mints, 30);

  for (const c of chunks) {
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${c.join(',')}`, { cache: 'no-store' });
      if (!res.ok) { await sleep(150); continue; }
      const json = await res.json();
      const pairs: DexPair[] = json?.pairs || [];
      for (const p of pairs) {
        if (p?.chainId === 'solana' && p?.baseToken?.address && c.includes(p.baseToken.address)) {
          results.push(p);
        }
      }
      await sleep(150);
    } catch {
      // ignore this chunk
    }
  }
  return results;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const nocache = url.searchParams.get('nocache') === '1';

  if (!nocache) {
    const hit = getCache<any>(CACHE_KEY);
    if (hit) return NextResponse.json(hit, { headers: { 'x-cache': 'HIT' }});
  }

  try {
    const discovered = await discoverMints24h();                 // real BAGS mints
    const mints = discovered.map(d=>d.mint);
    const markets = mints.length ? await loadMarketsBulk(mints) : [];

    // group by mint and take best market by liquidity
    const byMint = new Map<string, DexPair[]>();
    for (const p of markets) {
      const mint = p?.baseToken?.address!;
      if (!byMint.has(mint)) byMint.set(mint, []);
      byMint.get(mint)!.push(p);
    }

    let volume24h = 0, totalLiq = 0;
    const best: DexPair[] = [];
    for (const [mint, arr] of byMint) {
      arr.sort((a,b)=> num(b.liquidity?.usd) - num(a.liquidity?.usd));
      const top = arr[0];
      best.push(top);
      volume24h += num(top?.volume?.h24);
      totalLiq += num(top?.liquidity?.usd);
    }

    best.sort((a,b)=> num(b.fdv) - num(a.fdv));
    const top = best.slice(0,10).map(p=>({
      pair: `${p.baseToken?.symbol ?? ''}/${p.quoteToken?.symbol ?? ''}`.replace(/^\//,''),
      priceUsd: num(p.priceUsd),
      change24h: (typeof p.priceChange?.h24 === 'string') ? Number(p.priceChange?.h24) : (p.priceChange?.h24 ?? null),
      vol24hUsd: num(p.volume?.h24),
      liquidityUsd: num(p.liquidity?.usd),
      fdvUsd: num(p.fdv),
      link: p.url ?? null,
      chain: p.chainId,
      dex: p.dexId
    }));

    const payload = {
      lastUpdated: Date.now(),
      stats: {
        totalTokens24h: discovered.length,   // реальное число минтов за 24ч
        activeTokens: byMint.size,           // для которых есть рынок
        volume24hUsd: volume24h,
        totalLiquidityUsd: totalLiq,
      },
      top,
      note: 'Discovery via Helius (programs) • Markets via Dexscreener (bulk) • Batched RPC • 60s cache'
    };

    setCache(CACHE_KEY, payload, TTL);
    return NextResponse.json(payload, { headers: { 'x-cache': 'MISS' }});
  } catch (e: any) {
    const stale = getCache<any>(CACHE_KEY);
    if (stale) return NextResponse.json(stale, { headers: { 'x-cache': 'STALE' }});
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}