import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 60;

type DexPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string; symbol?: string; name?: string };
  quoteToken?: { address?: string; symbol?: string; name?: string };
  priceUsd?: string | number;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  pairCreatedAt?: number;
};

const DS_URL = 'https://api.dexscreener.com/latest/dex/search?q=chain:solana';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode'); // 'all' | 'new24h'
    const resp = await fetch(DS_URL, { next: { revalidate } });

    if (!resp.ok) {
      throw new Error(`Dexscreener ${resp.status}`);
    }

    const json = await resp.json();
    const pairs: DexPair[] = Array.isArray(json?.pairs) ? json.pairs : [];

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    let filtered = pairs.filter(p =>
      (p?.chainId === 'solana') &&
      ((p?.volume?.h24 ?? 0) > 0) &&
      ((p?.liquidity?.usd ?? 0) > 1000)
    );

    if (mode === 'new24h') {
      filtered = filtered.filter(p => (p?.pairCreatedAt ?? 0) >= dayAgo);
    }

    // Aggregates
    const tokenSet = new Set<string>();
    for (const p of filtered) {
      tokenSet.add(p?.baseToken?.address || p?.pairAddress || '');
    }

    const stats = {
      totalTokens: Array.from(tokenSet).filter(Boolean).length,
      activePairs: filtered.length,
      volume24h: filtered.reduce((s, p) => s + (Number(p?.volume?.h24) || 0), 0),
      totalLiquidity: filtered.reduce((s, p) => s + (Number(p?.liquidity?.usd) || 0), 0),
      mode: mode === 'new24h' ? 'new24h' : 'all',
    };

    // Top 25 by 24h volume
    filtered.sort(
      (a, b) => (Number(b?.volume?.h24) || 0) - (Number(a?.volume?.h24) || 0)
    );

    const list = filtered.slice(0, 25).map(p => ({
      id: p?.pairAddress || `${p?.baseToken?.address}-${p?.quoteToken?.address}`,
      pair: `${p?.baseToken?.symbol ?? '?'} / ${p?.quoteToken?.symbol ?? ''}`,
      chain: p?.chainId ?? '—',
      dex: p?.dexId ?? '—',
      priceUsd: Number(p?.priceUsd) || 0,
      change24h: Number(p?.priceChange?.h24) || 0,
      vol24h: Number(p?.volume?.h24) || 0,
      liquidity: Number(p?.liquidity?.usd) || 0,
      fdv: Number(p?.fdv) || 0,
      url: p?.url || '',
    }));

    return NextResponse.json(
      { stats, list },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Failed to load markets' },
      { status: 500 }
    );
  }
}