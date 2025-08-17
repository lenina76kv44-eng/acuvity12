import { NextResponse } from 'next/server';

export const revalidate = 60;

const SEARCH_URL =
  'https://api.dexscreener.com/latest/dex/search?q=solana%20meteora';
const TRENDING_URL =
  'https://api.dexscreener.com/latest/dex/trending/pairs/solana';

// number-safe coercion
const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export async function GET() {
  try {
    // 1) try search (solana + meteora)
    const r1 = await fetch(SEARCH_URL, {
      headers: { accept: 'application/json' },
      // SSR caching
      next: { revalidate },
    });

    let list: any[] = [];
    if (r1.ok) {
      const j1 = await r1.json().catch(() => ({}));
      list = Array.isArray(j1?.pairs) ? j1.pairs : [];
    }

    // 2) fallback to trending/solana if search is empty
    if (!list.length) {
      const r2 = await fetch(TRENDING_URL, {
        headers: { accept: 'application/json' },
        next: { revalidate },
      });
      if (r2.ok) {
        const j2 = await r2.json().catch(() => ({}));
        list = Array.isArray(j2?.pairs) ? j2.pairs : [];
      }
    }

    // filter for Solana only (dexId may vary, поэтому не жёстко)
    const filtered = list.filter(
      (p) => (p?.chainId || '').toLowerCase() === 'solana'
    );

    const pairs = filtered.map((p) => ({
      id:
        p?.pairAddress ||
        `${p?.chainId}-${p?.dexId}-${p?.baseToken?.address}-${p?.quoteToken?.address}`,
      url: p?.url || '',
      chainId: p?.chainId || '',
      dexId: p?.dexId || '',
      base: {
        symbol: p?.baseToken?.symbol || '',
        address: p?.baseToken?.address || '',
      },
      priceUsd: n(p?.priceUsd),
      change24h: n(p?.priceChange?.h24),
      vol24h: n(p?.volume?.h24),
      liquidityUsd: n(p?.liquidity?.usd),
      fdv: n(p?.fdv),
    }));

    // aggregates
    const uniqueBases = new Set(pairs.map((p) => p.base.address).filter(Boolean));
    const totals = {
      totalTokens: uniqueBases.size,
      activePairs: pairs.length,
      volume24h: pairs.reduce((a, b) => a + b.vol24h, 0),
      totalLiquidity: pairs.reduce((a, b) => a + b.liquidityUsd, 0),
    };

    // top-50 by 24h volume
    const top = [...pairs].sort((a, b) => b.vol24h - a.vol24h).slice(0, 50);

    return NextResponse.json({ totals, list: top });
  } catch (e: any) {
    return new NextResponse(
      JSON.stringify({ error: e?.message || 'failed' }),
      { status: 500 }
    );
  }
}