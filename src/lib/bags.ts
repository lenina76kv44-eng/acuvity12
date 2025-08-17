import { BAGS_REGISTRY_URL, BAGS_TOKEN_LIST } from '@/src/config/bags.local';

export type BagsToken = { mint: string; createdAt?: number };

type RegistryResp = { tokens?: BagsToken[] };

async function fetchRegistry(url: string): Promise<BagsToken[]> {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return [];
    const data = (await r.json()) as RegistryResp;
    return Array.isArray(data?.tokens) ? data.tokens.filter(t => t?.mint) : [];
  } catch {
    return [];
  }
}

export async function loadBagsTokens(): Promise<BagsToken[]> {
  if (BAGS_REGISTRY_URL) {
    const fromUrl = await fetchRegistry(BAGS_REGISTRY_URL);
    if (fromUrl.length) return fromUrl;
  }
  return (BAGS_TOKEN_LIST || []).filter(Boolean).map(mint => ({ mint }));
}