// src/lib/dexscreener.ts
const DEX_URL = 'https://api.dexscreener.com/latest/dex';

export type DexPair = {
  chainId: string;
  dexId?: string;
  pairAddress?: string;
  baseToken: { address: string; symbol?: string };
  quoteToken: { address: string; symbol?: string };
  priceUsd?: string;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  pairCreatedAt?: number; // ms
  url?: string; // link back to dexscreener
};

type DexSearchResponse = { pairs?: DexPair[] };

async function safeFetch(url: string, init?: RequestInit, retries = 2): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, { ...init, next: { revalidate: 60 } });
      if (r.ok) return r;
      lastErr = new Error(`${r.status} ${r.statusText}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise(res => setTimeout(res, 300 * (i + 1)));
  }
  throw lastErr ?? new Error('fetch failed');
}

/** 
 * Pulls a wide search result and filters to Solana + tokens whose symbol ends with the given suffix (e.g. "BAGS"). 
 * DexScreener search supports free text; "chain:solana BAGS" narrows result set.
 */
export async function fetchBagsUniverse(suffix = 'BAGS'): Promise<DexPair[]> {
  const q = encodeURIComponent(`chain:solana ${suffix}`);
  const res = await safeFetch(`${DEX_URL}/search?q=${q}`);
  const data = (await res.json()) as DexSearchResponse;

  const raw = data.pairs?.filter(p => p.chainId === 'solana') ?? [];

  // Deduplicate by baseToken (keep best pair by liquidity)
  const bestByMint = new Map<string, DexPair>();
  for (const p of raw) {
    const sym = (p.baseToken.symbol || '').toUpperCase();
    if (!sym.endsWith(suffix.toUpperCase())) continue;

    const id = p.baseToken.address;
    const current = bestByMint.get(id);
    const curLiq = current?.liquidity?.usd ?? 0;
    const liq = p.liquidity?.usd ?? 0;
    if (!current || liq > curLiq) bestByMint.set(id, p);
  }
  return Array.from(bestByMint.values());
}

export function computeMetrics(pairs: DexPair[]) {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  let totalTokens24h = 0;
  let activeTokens = 0;
  let vol24 = 0;
  let liq = 0;

  for (const p of pairs) {
    const created = p.pairCreatedAt ?? 0;
    if (created >= dayAgo) totalTokens24h++;
    if ((p.liquidity?.usd ?? 0) > 0) activeTokens++;
    vol24 += p.volume?.h24 ?? 0;
    liq += p.liquidity?.usd ?? 0;
  }

  // Top by FDV, fallback to liquidity if FDV is missing
  const top = [...pairs].sort((a, b) => {
    const af = a.fdv ?? 0, bf = b.fdv ?? 0;
    if (af !== bf) return bf - af;
    const al = a.liquidity?.usd ?? 0, bl = b.liquidity?.usd ?? 0;
    return bl - al;
  }).slice(0, 10);

  return {
    totals: {
      tokens24h: totalTokens24h,
      activeTokens,
      volume24h: vol24,
      liquidityTotal: liq,
    },
    top,
  };
}

export function formatUsd(v?: number) {
  const n = Number(v ?? 0);
  return n >= 1e9
    ? `$${(n/1e9).toFixed(2)}B`
    : n >= 1e6
      ? `$${(n/1e6).toFixed(2)}M`
      : n >= 1e3
        ? `$${(n/1e3).toFixed(2)}K`
        : `$${n.toFixed(0)}`;
}