type DexPair = {
  pairAddress: string;
  dexId: string;
  chainId: string;
  baseToken: { address: string; symbol: string; name: string };
  quoteToken: { address: string; symbol: string; name: string };
  priceUsd?: string;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  createdAt?: number; // ms
  url?: string;
};

export type BagsMarketRow = {
  mint: string;
  symbol: string;
  priceUsd: number | null;
  change24h: number | null;
  vol24h: number | null;
  liquidityUsd: number | null;
  fdvUsd: number | null;
  link: string | null;
};

const DS_BASE = "https://api.dexscreener.com/latest/dex";
const BE_BASE = "https://public-api.birdeye.so";

async function fromDexscreener(mint: string): Promise<BagsMarketRow | null> {
  try {
    const ds = await fetch(`${DS_BASE}/tokens/${mint}`, { next: { revalidate: 120 } });
    if (!ds.ok) return null;
    const json = await ds.json();
    const pair: DexPair | undefined = json?.pairs?.[0];
    if (!pair) return null;
    return {
      mint,
      symbol: pair.baseToken?.symbol ?? mint.slice(0,6),
      priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
      change24h: null, // DS lite endpoint lacks change; can compute later if needed
      vol24h: pair.volume?.h24 ?? null,
      liquidityUsd: pair.liquidity?.usd ?? null,
      fdvUsd: pair.fdv ?? null,
      link: pair.url ?? null,
    };
  } catch {
    return null;
  }
}

async function fromBirdeye(mint: string): Promise<Partial<BagsMarketRow> | null> {
  try {
    // Birdeye has public endpoints that work without key but rate-limited. Use only as fallback.
    const r = await fetch(`${BE_BASE}/defi/price?address=${mint}`, { 
      headers: { "x-chain": "solana" }, 
      next: { revalidate: 120 } 
    });
    if (!r.ok) return null;
    const j = await r.json();
    const price = j?.data?.value ?? null;

    const m = await fetch(`${BE_BASE}/defi/token_overview?address=${mint}`, { 
      headers: { "x-chain": "solana" }, 
      next: { revalidate: 120 } 
    });
    if (!m.ok) return { priceUsd: price };
    const ov = await m.json();
    return {
      priceUsd: price,
      fdvUsd: ov?.data?.mc ?? null,
      liquidityUsd: ov?.data?.liquidity ?? null,
      vol24h: ov?.data?.v24hUSD ?? null,
      symbol: ov?.data?.symbol ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function enrichMarkets(mints: string[]): Promise<BagsMarketRow[]> {
  const rows: BagsMarketRow[] = [];
  for (const mint of mints) {
    let row = await fromDexscreener(mint);
    if (!row) {
      row = { 
        mint, 
        symbol: mint.slice(0,6), 
        priceUsd: null, 
        change24h: null, 
        vol24h: null, 
        liquidityUsd: null, 
        fdvUsd: null, 
        link: null 
      };
    }
    const be = await fromBirdeye(mint);
    if (be) {
      row = { ...row, ...be, symbol: be.symbol || row.symbol };
    }
    rows.push(row);
  }
  return rows;
}