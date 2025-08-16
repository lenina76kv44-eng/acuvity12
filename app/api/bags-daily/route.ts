import { NextResponse } from 'next/server';
import { getBagsMintsLastHours } from '@/src/lib/bagsLive';
import { enrichMany, DSPair } from '@/src/lib/dexscreener';

export const runtime = 'nodejs';
export const revalidate = 0;
export const dynamic = 'force-dynamic';

// In-memory cache
let cachedData: any = null;
let lastFetchTime: number = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function GET(req: Request) {
  const url = new URL(req.url);
  const hours = Math.min(72, Math.max(1, parseInt(url.searchParams.get('hours') || '24', 10)));

  // Check cache first
  if (cachedData && (Date.now() - lastFetchTime < CACHE_TTL)) {
    return NextResponse.json(cachedData);
  }

  try {
    // 1) discover BAGS token mints for the last N hours
    const mints = await getBagsMintsLastHours(hours);

    // 2) DexScreener enrichment (volume, liquidity, price) when available
    const pairsByMint = await enrichMany(mints);

    // rollups
    let totalLiquidity = 0;
    let totalVol24 = 0;
    let activePairs = 0;

    const rows = mints.map(mint => {
      const ps = pairsByMint[mint] || [];
      // Sort pairs by 24h volume to get the best one for display
      const best = ps.sort((a,b)=> (Number(b?.volume?.h24||0) - Number(a?.volume?.h24||0)));

      // Sum totals across all pairs for this mint
      ps.forEach(p=>{
        const liq = Number(p?.liquidity?.usd || 0);
        const vol = Number(p?.volume?.h24 || 0);
        if (liq > 0) activePairs += 1; // Count pairs with liquidity
        totalLiquidity += liq;
        totalVol24 += vol;
      });

      return {
        mint,
        pairsCount: ps.length, // Number of pairs found on Dexscreener for this mint
        topPair: best ? {
          pairAddress: best.pairAddress,
          dex: best.dexId,
          priceUsd: best.priceUsd ? Number(best.priceUsd) : null,
          fdv: best.fdv ?? null,
          liquidityUsd: best.liquidity?.usd ?? 0,
          vol24: best.volume?.h24 ?? 0,
          url: best.url ?? null,
          base: {
            symbol: best.baseToken?.symbol ?? null,
            name: best.baseToken?.name ?? null,
            image: best.info?.imageUrl ?? null,
          }
        } : null
      };
    });

    // Sort the final list by the top pair's 24h volume
    const sortedRows = rows.sort((a,b)=> (Number(b?.topPair?.vol24||0) - Number(a?.topPair?.vol24||0)));

    const responseData = {
      ok: true,
      windowHours: hours,
      totalTokens: mints.length, // Total BAGS tokens discovered in the window
      activePairs, // Total active pairs found on Dexscreener
      totals: {
        liquidityUsd: Number(totalLiquidity.toFixed(2)),
        volume24hUsd: Number(totalVol24.toFixed(2)),
      },
      list: sortedRows
    };

    // Cache the response
    cachedData = responseData;
    lastFetchTime = Date.now();

    return NextResponse.json(responseData);
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: String(e?.message||e) }, { status: 500 });
  }
}