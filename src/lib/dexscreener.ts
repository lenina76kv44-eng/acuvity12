import { fetchJson } from './http';

type DexPair = {
  url: string;
  baseToken?: { address?: string };
  quoteToken?: { address?: string; symbol?: string };
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  fdv?: number;
  priceUsd?: string;
}
type DexResp = { pairs?: DexPair[] };

export async function getDexSnapshotByMint(mint: string): Promise<{volume24h: number, liquidityUsd: number, fdv: number, url?: string}> {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`;
    const data = await fetchJson<DexResp>(url);
    const best = (data?.pairs || []).sort((a,b) => (b.liquidity?.usd||0) - (a.liquidity?.usd||0))[0];
    return {
      volume24h: best?.volume?.h24 || 0,
      liquidityUsd: best?.liquidity?.usd || 0,
      fdv: best?.fdv || 0,
      url: best?.url
    };
  } catch { return { volume24h: 0, liquidityUsd: 0, fdv: 0 }; }
}