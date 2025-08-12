export type TokenMeta = {
  name: string;
  symbol?: string;
  logoURI?: string;
  sources: string[]; // ['jupiter'] | ['dexscreener']
};

const cache = new Map<string, TokenMeta | null>();

let jupReady: Promise<void> | null = null;
let jupMap: Record<string, TokenMeta> = {};

/** Load Jupiter token list once per session */
export function preloadJupiterList() {
  if (!jupReady) {
    jupReady = fetch('https://token.jup.ag/all')
      .then((r) => (r.ok ? r.json() : []))
      .then((arr: any[]) => {
        const next: Record<string, TokenMeta> = {};
        for (const t of arr || []) {
          if (!t?.address) continue;
          next[t.address] = {
            name: t.name ?? t.symbol ?? 'Unknown Token',
            symbol: t.symbol ?? undefined,
            logoURI: t.logoURI ?? undefined,
            sources: ['jupiter'],
          };
        }
        jupMap = next;
      })
      .catch(() => {
        jupMap = {};
      });
  }
  return jupReady;
}

async function fetchDexscreenerMeta(mint: string): Promise<TokenMeta | null> {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const pair = data?.pairs?.[0];
    if (!pair) return null;

    const baseIsMint = pair?.baseToken?.address?.toLowerCase() === mint.toLowerCase();
    const token = baseIsMint ? pair?.baseToken : pair?.quoteToken;

    const name = token?.name || token?.symbol;
    const symbol = token?.symbol;
    const logo = pair?.info?.imageUrl || pair?.info?.image || undefined;

    if (!name) return null;

    return { name, symbol, logoURI: logo, sources: ['dexscreener'] };
  } catch {
    return null;
  }
}

export async function getTokenMeta(mint: string): Promise<TokenMeta | null> {
  if (!mint) return null;
  if (cache.has(mint)) return cache.get(mint)!;

  if (jupMap[mint]) {
    cache.set(mint, jupMap[mint]);
    return jupMap[mint];
  }
  const ds = await fetchDexscreenerMeta(mint);
  cache.set(mint, ds);
  return ds;
}

export async function batchResolveMetas(mints: string[]): Promise<Record<string, TokenMeta | null>> {
  await preloadJupiterList().catch(() => {});
  const unique = [...new Set(mints.filter(Boolean))];
  const entries = await Promise.all(unique.map(async (m) => [m, await getTokenMeta(m)] as const));
  return Object.fromEntries(entries);
}

export function fallbackAvatar(mint: string) {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(mint)}`;
}