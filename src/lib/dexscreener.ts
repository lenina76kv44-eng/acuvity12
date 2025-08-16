// Lightweight DexScreener client (no api key needed)
export type DSPair = {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken?: { address?: string; symbol?: string; name?: string };
  quoteToken?: { address?: string; symbol?: string; name?: string };
  priceUsd?: string;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  url?: string;
  info?: { imageUrl?: string };
};

export type DSTokenMeta = {
  name?: string;
  symbol?: string;
  imageUrl?: string;
};

const DS_BASE = 'https://api.dexscreener.com';

export async function fetchPairsByToken(mint: string): Promise<DSPair[]> {
  const url = `${DS_BASE}/latest/dex/tokens/${mint}`;
  const r = await fetch(url, { next: { revalidate: 30 }});
  if (!r.ok) return [];
  const j = await r.json().catch(() => null);
  const pairs = Array.isArray(j?.pairs) ? j.pairs as DSPair[] : [];
  // keep only Solana
  return pairs.filter(p => p.chainId === 'solana');
}

export async function enrichMany(mints: string[]): Promise<Record<string, DSPair[]>> {
  const uniq = [...new Set(mints.filter(Boolean))];
  const out: Record<string, DSPair[]> = {};
  // small concurrency to be polite
  const batch = 6;
  for (let i = 0; i < uniq.length; i += batch) {
    await Promise.all(
      uniq.slice(i, i + batch).map(async m => {
        try { out[m] = await fetchPairsByToken(m); } catch { out[m] = []; }
      })
    );
  }
  return out;
}