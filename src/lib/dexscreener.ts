// src/lib/dexscreener.ts
export type DexPair = {
  chainId: string;
  dexId: string;
  pairAddress?: string;
  pairCreatedAt?: number; // ms
  url?: string;

  baseToken: { address: string; symbol?: string; name?: string; logoURI?: string };
  quoteToken: { address: string; symbol?: string; name?: string };

  priceUsd?: number;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
};

const DEX_IDS = ["raydium", "meteora", "pumpswap"] as const;

async function fetchLatestDex(dexId: string): Promise<DexPair[]> {
  const url = `https://api.dexscreener.com/latest/dex/pairs/solana/${dexId}`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Dexscreener ${dexId} ${res.status}`);
  const json = await res.json();
  return (json?.pairs || []) as DexPair[];
}

export async function fetchSolanaLatestPairs(): Promise<DexPair[]> {
  const results = await Promise.allSettled(DEX_IDS.map(fetchLatestDex));
  const all: DexPair[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  return all;
}

export type BagsMetrics = {
  tokens24h: number;
  activePairs: number;
  volume24hUsd: number;
  marketCapSumUsd: number;
  allTimeTokens?: number | null;
  top: Array<{
    mint: string;
    symbol: string;
    name: string;
    dex: string;
    priceUsd: number | null;
    change24h: number | null;
    volume24hUsd: number | null;
    liquidityUsd: number | null;
    fdvUsd: number | null;
    url?: string;
    logoURI?: string;
    chainId: string;
  }>;
};

export function dedupeByBaseMint(pairs: DexPair[]): DexPair[] {
  const seen = new Set<string>();
  const out: DexPair[] = [];
  for (const p of pairs) {
    const mint = p?.baseToken?.address;
    if (!mint || seen.has(mint)) continue;
    seen.add(mint);
    out.push(p);
  }
  return out;
}

export function onlyCreatedLast24h(pairs: DexPair[]): DexPair[] {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  return pairs.filter(p => (p.pairCreatedAt ?? 0) >= since);
}

export function filterByBagsSuffix(pairs: DexPair[], suffix = "BAGS"): DexPair[] {
  const s = (suffix || "").trim();
  if (!s) return pairs;
  return pairs.filter(p => p?.baseToken?.address?.endsWith(s));
}

export function toMetrics(pairs: DexPair[], allTimeTokens?: number | null): BagsMetrics {
  const tokens24h = pairs.length;

  let activePairs = 0;
  let volume24hUsd = 0;
  let marketCapSumUsd = 0;

  for (const p of pairs) {
    const vol = p?.volume?.h24 ?? 0;
    const fdv = p?.fdv ?? 0;
    if (vol > 0) activePairs++;
    volume24hUsd += vol || 0;
    marketCapSumUsd += fdv || 0;
  }

  const top = [...pairs]
    .sort((a, b) => (b.fdv ?? 0) - (a.fdv ?? 0))
    .slice(0, 10)
    .map(p => ({
      mint: p.baseToken.address,
      symbol: p.baseToken.symbol || p.baseToken.address.slice(0, 4),
      name: p.baseToken.name || p.baseToken.symbol || p.baseToken.address,
      dex: p.dexId,
      priceUsd: p.priceUsd ?? null,
      change24h: p?.priceChange?.h24 ?? null,
      volume24hUsd: p?.volume?.h24 ?? null,
      liquidityUsd: p?.liquidity?.usd ?? null,
      fdvUsd: p.fdv ?? null,
      url: p.url,
      logoURI: (p.baseToken as any)?.logoURI || undefined,
      chainId: p.chainId,
    }));

  return { tokens24h, activePairs, volume24hUsd, marketCapSumUsd, allTimeTokens: allTimeTokens ?? null, top };
}