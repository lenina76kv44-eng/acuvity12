// src/lib/tokenMeta.ts
export type TokenMeta = {
  name: string;
  symbol?: string;
  logoURI?: string;
  sources: string[]; // ['jupiter'] | ['dexscreener']
};

const cache = new Map<string, TokenMeta | null>();

let jupReady: Promise<void> | null = null;
let jupMap: Record<string, TokenMeta> = {};

/** Предзагрузка списка токенов Jupiter (один раз за сессию) */
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
        // молча: просто не будет данных Jupiter
        jupMap = {};
      });
  }
  return jupReady;
}

/** Фолбэк: взять метаданные с DexScreener */
async function fetchDexscreenerMeta(mint: string): Promise<TokenMeta | null> {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const pair = data?.pairs?.[0];
    if (!pair) return null;

    // Выбираем сторону, соответствующую mint
    const baseIsMint =
      pair?.baseToken?.address?.toLowerCase() === mint.toLowerCase();
    const token = baseIsMint ? pair?.baseToken : pair?.quoteToken;

    const name = token?.name || token?.symbol;
    const symbol = token?.symbol;
    const logo =
      pair?.info?.imageUrl ||
      pair?.info?.image ||
      undefined;

    if (!name) return null;

    return {
      name,
      symbol,
      logoURI: logo,
      sources: ['dexscreener'],
    };
  } catch {
    return null;
  }
}

/** Взять метаданные токена с кэшем и fallback-логикой */
export async function getTokenMeta(mint: string): Promise<TokenMeta | null> {
  if (!mint) return null;
  if (cache.has(mint)) return cache.get(mint)!;

  // 1) Jupiter
  if (jupMap[mint]) {
    cache.set(mint, jupMap[mint]);
    return jupMap[mint];
  }

  // 2) DexScreener
  const ds = await fetchDexscreenerMeta(mint);
  cache.set(mint, ds);
  return ds;
}

/** Батч-резолв для списка mint'ов */
export async function batchResolveMetas(
  mints: string[]
): Promise<Record<string, TokenMeta | null>> {
  await preloadJupiterList().catch(() => {});
  const unique = [...new Set(mints.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (m) => [m, await getTokenMeta(m)] as const)
  );
  return Object.fromEntries(entries);
}

/** Фолбэк-аватар для неизвестных токенов */
export function fallbackAvatar(mint: string) {
  // бесключевой генератор svg/png-аватарок
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
    mint
  )}`;
}