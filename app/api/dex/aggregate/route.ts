import { NextResponse } from 'next/server';
import { fetchJson } from '@/src/lib/http';
import { BAGS_DEFAULT_QUERY, BAGS_MINTS } from '@/src/config/bags';
import type { DexPair, DexSearchResponse, DexTokensResponse } from '@/src/types/dex';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';   // always fresh
export const revalidate = 0;

function normalizePair(p: DexPair) {
  const priceUsd = Number(p.priceUsd ?? 0);
  const liq = Number(p.liquidity?.usd ?? 0);
  const vol24 = Number(p.volume?.h24 ?? 0);
  const fdv = Number(p.fdv ?? p.marketCap ?? 0);
  const buys = Number(p.txns?.h24?.buys ?? 0);
  const sells = Number(p.txns?.h24?.sells ?? 0);
  const change24 = Number(p.priceChange?.h24 ?? 0);
  const base = p.baseToken?.symbol || p.baseToken?.name || '—';
  const quote = p.quoteToken?.symbol || p.quoteToken?.name || '';
  return { priceUsd, liq, vol24, fdv, tx24: buys + sells, change24, base, quote };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = (url.searchParams.get('query') || BAGS_DEFAULT_QUERY).trim();
    const mintsParam = (url.searchParams.get('mints') || '').trim();
    const take = Math.min(Math.max(Number(url.searchParams.get('take') || 8), 3), 20);

    const mints = (mintsParam ? mintsParam.split(',') : BAGS_MINTS).map(s => s.trim()).filter(Boolean);

    // Get pairs
    let pairs: DexPair[] = [];
    if (mints.length) {
      // Merge all token responses, dedupe by pairAddress
      const results = await Promise.allSettled(
        mints.map(m => fetchJson<DexTokensResponse>(`https://api.dexscreener.com/latest/dex/tokens/${m}`, {}, 2, 15000))
      );
      const seen = new Set<string>();
      for (const r of results) {
        if (r.status === 'fulfilled') {
          for (const p of (r.value?.pairs ?? [])) {
            const key = p.pairAddress || `${p.chainId}:${p.baseToken?.address}:${p.quoteToken?.address}`;
            if (key && !seen.has(key)) { seen.add(key); pairs.push(p); }
          }
        }
      }
    } else {
      const s = await fetchJson<DexSearchResponse>(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`, {}, 2, 15000);
      pairs = s.pairs ?? [];
    }

    // Aggregate
    let totalPairs = 0, totalTokens = 0, vol24 = 0, liq = 0, fdv = 0, tx24 = 0;
    const tokenSet = new Set<string>();
    const norm: Array<{ raw: DexPair; norm: ReturnType<typeof normalizePair> }> = [];

    for (const p of pairs) {
      const baseAddr = p.baseToken?.address || `${p.chainId}:${p.baseToken?.symbol}`;
      if (baseAddr) tokenSet.add(baseAddr);
      const v = normalizePair(p);
      vol24 += v.vol24;
      liq   += v.liq;
      fdv   += v.fdv;
      tx24  += v.tx24;
      totalPairs++;
      norm.push({ raw: p, norm: v });
    }
    totalTokens = tokenSet.size;

    // top markets by 24h volume
    norm.sort((a, b) => (b.norm.vol24 - a.norm.vol24));
    const top = norm.slice(0, take).map(({ raw, norm }) => ({
      pair: `${norm.base}/${norm.quote}`,
      chainId: raw.chainId,
      dexId: raw.dexId || '—',
      url: raw.url || '',
      priceUsd: norm.priceUsd || 0,
      change24: norm.change24 || 0,
      vol24: norm.vol24 || 0,
      liquidity: norm.liq || 0,
      fdv: norm.fdv || 0,
      logo: raw.info?.imageUrl || null,
    }));

    return NextResponse.json({
      ok: true,
      input: { query, mints, count: pairs.length },
      aggregate: {
        tokens: totalTokens,
        pairs: totalPairs,
        volume24hUsd: vol24,
        liquidityUsd: liq,
        marketCapUsd: fdv,
        txns24h: tx24,
        at: Date.now()
      },
      top
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}