export type DexTokenRef = {
  address?: string;
  symbol?: string;
  name?: string;
};

export type DexPair = {
  chainId: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: DexTokenRef;
  quoteToken?: DexTokenRef;
  priceUsd?: number | string;
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
  volume?: { h24?: number };
  txns?: { h24?: { buys?: number; sells?: number } };
  priceChange?: { h24?: number };
  info?: { imageUrl?: string };
};

export type DexSearchResponse = { pairs?: DexPair[] };
export type DexTokensResponse = { pairs?: DexPair[] };