import { chunk, jfetch } from './http';

type DexPair = {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; symbol: string };
  quoteToken: { address: string; symbol: string };
  priceUsd?: string;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  url?: string;
};

type DexTokensResp = { pairs?: DexPair[] };

export type TokenMarket = {
  mint: string;
  pair?: string;
  priceUsd?: number;
  fdv?: number;
  liquidityUsd?: number;
  vol24hUsd?: number;
  url?: string;
  dexId?: string;
  chainId?: string;
};

export async function loadMarketsForMints(mints: string[], signal?: AbortSignal): Promise<TokenMarket[]> {
  if (!mints.length) return [];
  const results: TokenMarket[] = [];
  // dexscreener supports comma-separated up to ~30 tokens; use 20 for safety
  for (const group of chunk(mints, 20)) {
    try {
      const url = `https://api.dexscreener.com/latest/dex/tokens/${group.join(',')}`;
      const data = await jfetch<DexTokensResp>(url, { timeoutMs: 8000 });
      const pairs = data?.pairs ?? [];
      // pick best pair per token by highest 24h volume
      const byMint = new Map<string, DexPair>();
      for (const p of pairs) {
        const mint = p.baseToken?.address;
        if (!mint) continue;
        const prev = byMint.get(mint);
        const curVol = p.volume?.h24 ?? 0;
        const prevVol = prev?.volume?.h24 ?? -1;
        if (!prev || curVol > prevVol) byMint.set(mint, p);
      }
      for (const [mint, p] of byMint) {
        results.push({
          mint,
          pair: p.pairAddress,
          priceUsd: p.priceUsd ? Number(p.priceUsd) : undefined,
          fdv: p.fdv,
          liquidityUsd: p.liquidity?.usd,
          vol24hUsd: p.volume?.h24,
          url: p.url,
          dexId: p.dexId,
          chainId: p.chainId,
        });
      }
    } catch (_) {
      // continue batches
    }
  }
  return results;
}