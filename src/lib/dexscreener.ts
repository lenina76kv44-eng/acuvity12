type DexPair = {
  chainId: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string; symbol?: string };
  quoteToken?: { address?: string; symbol?: string };
  priceUsd?: string;
  fdv?: number;
  marketCap?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  createdAt?: number; // ms
  age?: number;       // seconds
};

const BASE = 'https://api.dexscreener.com/latest/dex';

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export async function getBestPairForMint(mint: string): Promise<DexPair | null> {
  type Resp = { pairs?: DexPair[] };
  const data = await safeFetch<Resp>(`${BASE}/tokens/${mint}`);
  if (!data?.pairs?.length) return null;
  const sol = data.pairs.filter(p => p.chainId === 'solana');
  if (!sol.length) return null;
  const best = sol
    .map(p => ({ p, liq: p.liquidity?.usd ?? 0, vol: p.volume?.h24 ?? 0 }))
    .sort((a, b) => (b.liq - a.liq) || (b.vol - a.vol));
  return best[0].p;
}