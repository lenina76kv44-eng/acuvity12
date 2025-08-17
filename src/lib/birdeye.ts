type TokenStats = {
  mint: string;
  symbol?: string;
  name?: string;
  price?: number;
  liquidityUSD?: number;
  marketCapUSD?: number;
  volume24hUSD?: number;
  fdvUSD?: number;
  logo?: string;
};

export async function getBirdeyeBundle(
  base: string,
  key: string,
  mints: string[]
): Promise<Record<string, TokenStats>> {
  const out: Record<string, TokenStats> = {};
  const headers = { "X-API-KEY": key, "accept": "application/json" };

  // helper with guard
  const safeFetch = async (url: string) => {
    try {
      const r = await fetch(url, { headers, cache: "no-store" });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  };

  // 1) token info (market cap, liquidity, symbol, name, logo)
  await Promise.all(mints.map(async (mint) => {
    out[mint] = { mint };
    const info = await safeFetch(`${base}/defi/token_info?address=${mint}`);
    const i = info?.data || info;
    if (i) {
      out[mint].symbol = i?.symbol || i?.tokenSymbol;
      out[mint].name = i?.name || i?.tokenName;
      out[mint].liquidityUSD = Number(i?.liquidity || i?.liquidityUSD) || 0;
      out[mint].marketCapUSD = Number(i?.marketCap || i?.market_cap || i?.mc) || 0;
      out[mint].fdvUSD = Number(i?.fdv || i?.fdvUSD) || 0;
      out[mint].logo = i?.logoURI || i?.logo || undefined;
    }

    // 2) price
    const price = await safeFetch(`${base}/defi/price?address=${mint}`);
    const p = price?.data || price;
    if (p) out[mint].price = Number(p?.value || p?.price) || out[mint].price || 0;

    // 3) 24h volume (ohlcv)
    const now = Math.floor(Date.now() / 1000);
    const start = now - 86400;
    const ohlcv = await safeFetch(`${base}/defi/ohlcv?address=${mint}&type=1D&time_from=${start}&time_to=${now}`);
    const c = ohlcv?.data || ohlcv;
    if (c?.[0]) {
      // common shapes: { v: number } or { volumeUSD: number }
      const v = Number(c[0].v ?? c[0].volumeUSD ?? 0);
      out[mint].volume24hUSD = v || 0;
    }
  }));

  return out;
}