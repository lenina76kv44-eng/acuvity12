import { NextResponse } from 'next/server';
import { discoverBagsTokens } from '@/src/lib/helius-bags';
import { loadMarketsForMints } from '@/src/lib/dexscreener';
import { getCached, setCached, getLastGood } from '@/src/lib/http';

export const dynamic = 'force-dynamic';

type MetricPayload = {
  updatedAt: number;
  totals: {
    tokens24h: number;
    activeTokens: number;      // tokens with liquidity > 1k or volume>0
    vol24hUsd: number;
    liquidityUsd: number;
  };
  top: Array<{
    mint: string;
    name?: string;
    priceUsd?: number;
    fdv?: number;
    liquidityUsd?: number;
    vol24hUsd?: number;
    url?: string;
    dexId?: string;
  }>;
};

const CACHE_KEY = 'bags:metrics:v2';
const TTL = 60_000; // 60s

export async function GET() {
  // serve hot cache immediately
  const hot = getCached<MetricPayload>(CACHE_KEY);
  if (hot) return NextResponse.json(hot, { headers: { 'x-cache': 'hit' } });

  try {
    const { today } = await discoverBagsTokens(24);
    const mints = today.map(t => t.mint);
    const markets = await loadMarketsForMints(mints);

    // aggregate
    let active = 0;
    let vol24 = 0;
    let liq = 0;
    for (const m of markets) {
      if ((m.liquidityUsd ?? 0) > 1000 || (m.vol24hUsd ?? 0) > 0) active += 1;
      vol24 += m.vol24hUsd ?? 0;
      liq += m.liquidityUsd ?? 0;
    }

    // join names
    const nameByMint = new Map(today.map(t => [t.mint, t.name]));
    const top = markets
      .map(m => ({
        mint: m.mint,
        name: nameByMint.get(m.mint),
        priceUsd: m.priceUsd,
        fdv: m.fdv,
        liquidityUsd: m.liquidityUsd,
        vol24hUsd: m.vol24hUsd,
        url: m.url,
        dexId: m.dexId,
      }))
      .sort((a, b) => (b.fdv ?? 0) - (a.fdv ?? 0))
      .slice(0, 10);

    const payload: MetricPayload = {
      updatedAt: Date.now(),
      totals: {
        tokens24h: today.length,
        activeTokens: active,
        vol24hUsd: Math.round(vol24),
        liquidityUsd: Math.round(liq),
      },
      top,
    };

    setCached(CACHE_KEY, payload, TTL);
    return NextResponse.json(payload, { headers: { 'x-cache': 'miss' } });
  } catch (e) {
    // graceful fallback to last good data
    const last = getLastGood<MetricPayload>(CACHE_KEY);
    if (last) return NextResponse.json(last, { headers: { 'x-cache': 'stale' } });
    return NextResponse.json({ error: 'failed' }, { status: 502 });
  }
}