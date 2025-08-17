import { NextResponse } from 'next/server';
import { loadBagsTokens } from '@/src/lib/bags';
import { getBestPairForMint } from '@/src/lib/dexscreener';

type TopRow = {
  pairAddress?: string;
  chainId?: string;
  dexId?: string;
  url?: string;
  name: string;
  priceUsd: number | null;
  change24h: number | null;
  volume24h: number | null;
  liquidityUsd: number | null;
  fdv: number | null;
  createdAt: number | null;
};

const CACHE_TTL_MS = 45_000;
let cacheAt = 0;
let cacheData: any | null = null;

function now() { return Date.now(); }

export const revalidate = 0;

export async function GET() {
  if (cacheData && now() - cacheAt < CACHE_TTL_MS) {
    return NextResponse.json(cacheData);
  }

  const tokens = await loadBagsTokens();
  if (!tokens.length) {
    const empty = { totals: { allTimeTokens: 0, new24h: 0, volume24h: 0, totalFdv: 0 }, top: [], generatedAt: now() };
    cacheData = empty; cacheAt = now();
    return NextResponse.json(empty);
  }

  // batch throttle
  const BATCH = 10;
  const enriched: Array<{ fdv: number; vol24: number; createdAt?: number; row: TopRow }> = [];

  for (let i = 0; i < tokens.length; i += BATCH) {
    const part = tokens.slice(i, i + BATCH);
    const settled = await Promise.allSettled(part.map(async t => {
      const pair = await getBestPairForMint(t.mint);
      if (!pair) return null;

      const fdv = (pair.fdv ?? pair.marketCap ?? 0) as number;
      const vol24 = (pair.volume?.h24 ?? 0) as number;
      const createdAt =
        t.createdAt ??
        (typeof pair.createdAt === 'number' ? pair.createdAt : undefined) ??
        (typeof pair.age === 'number' ? (now() - pair.age * 1000) : undefined);

      const row: TopRow = {
        pairAddress: pair.pairAddress,
        chainId: pair.chainId,
        dexId: pair.dexId,
        url: pair.url,
        name: `${pair.baseToken?.symbol || 'TOKEN'}/${pair.quoteToken?.symbol || 'SOL'}`,
        priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
        change24h: pair.priceChange?.h24 ?? null,
        volume24h: vol24 || null,
        liquidityUsd: pair.liquidity?.usd ?? null,
        fdv: fdv || null,
        createdAt: createdAt ?? null,
      };

      return { fdv, vol24, createdAt, row };
    }));

    for (const s of settled) if (s.status === 'fulfilled' && s.value) enriched.push(s.value);
    if (i + BATCH < tokens.length) await new Promise(r => setTimeout(r, 180));
  }

  let sumVol24 = 0, sumFdv = 0, new24h = 0;
  const tNow = now();

  for (const e of enriched) {
    sumVol24 += e.vol24 || 0;
    sumFdv   += e.fdv   || 0;
    if (e.createdAt && (tNow - e.createdAt) <= 24 * 3600 * 1000) new24h++;
  }

  const top = enriched
    .sort((a, b) => (b.fdv || 0) - (a.fdv || 0))
    .slice(0, 10)
    .map(e => e.row);

  const payload = {
    totals: { allTimeTokens: tokens.length, new24h, volume24h: sumVol24, totalFdv: sumFdv },
    top,
    generatedAt: tNow,
  };

  cacheData = payload;
  cacheAt = tNow;
  return NextResponse.json(payload);
}