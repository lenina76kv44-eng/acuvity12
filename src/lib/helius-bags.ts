import { jfetch } from './http';

const API_KEY = process.env.HELIUS_API_KEY!;
if (!API_KEY) console.warn('HELIUS_API_KEY is missing');

// try both common Helius RPC hosts; use the first that works
const HELIUS_ENDPOINTS = [
  process.env.HELIUS_RPC_URL, // if project already defines it
  `https://rpc.helius.xyz/?api-key=${API_KEY}`,
  `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`,
].filter(Boolean) as string[];

type SearchAssetsResp = {
  result: {
    items: Array<{
      id: string;                 // mint
      content?: { metadata?: { name?: string } };
      authorities?: any[];
      creators?: Array<{ address: string; share?: number }>;
      token_info?: { supply?: string };
      mint?: string;
      interface?: string;         // "FungibleToken"
      firstVerifiedCreators?: string[];
      ownership?: any;
      // timestamps (name depends on version, keep both checks later)
      createdAt?: string | number;
      // sometimes present as unix ms
      // sometimes we need to use recent_action time, so we sort anyway
    }>;
    total?: number;
  };
};

async function heliusRPC<T>(method: string, params: any): Promise<T> {
  let lastErr: any;
  for (const url of HELIUS_ENDPOINTS) {
    try {
      const body = {
        jsonrpc: '2.0',
        id: 'bags',
        method,
        params,
      };
      const res = await jfetch<{ result: any }>(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        timeoutMs: 9000,
      });
      return res as unknown as T;
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr ?? new Error('No Helius endpoint succeeded');
}

export type DiscoveredToken = {
  mint: string;
  name?: string;
  createdAtMs?: number;
};

export async function discoverBagsTokens(hours = 24): Promise<{
  today: DiscoveredToken[];
}> {
  const creatorsEnv = (process.env.BAGS_ACTOR_IDS || '').trim();
  const creators = creatorsEnv ? creatorsEnv.split(',').map(s => s.trim()).filter(Boolean) : [];
  if (!creators.length) {
    // safe fallback: empty
    return { today: [] };
  }
  const sinceMs = Date.now() - hours * 3600_000;

  const pageSize = 1000;
  const aggregates: DiscoveredToken[] = [];

  for (const creator of creators) {
    let page = 1;
    // We sort by recent_action to get newest mints first; stop when older than window
    while (true) {
      const payload = {
        ownerAddress: null,
        creatorAddress: creator,
        tokenType: 'fungible',
        page,
        limit: pageSize,
        sortBy: { sortBy: 'recent_action', sortOrder: 'desc' },
      };
      const data = await heliusRPC<SearchAssetsResp>('searchAssets', payload);
      const items = data?.result?.items ?? [];
      if (!items.length) break;

      let stop = false;
      for (const it of items) {
        const mint = it.mint || it.id;
        if (!mint) continue;
        const name = it?.content?.metadata?.name;
        // derive createdAtMs — if missing, treat as now to avoid dropping
        const createdAtMs =
          typeof (it as any).createdAt === 'number'
            ? (it as any).createdAt
            : typeof (it as any).createdAt === 'string'
              ? Date.parse((it as any).createdAt)
              : undefined;
        // we only need last 24h set
        if (createdAtMs && createdAtMs < sinceMs) {
          // since sorted desc, we can stop whole loop for this creator
          stop = true;
          break;
        }
        aggregates.push({ mint, name, createdAtMs });
      }

      if (stop) break;
      if (items.length < pageSize) break;
      page += 1;
      if (page > 10) break; // hard cap safety
    }
  }

  // filter strictly by time if timestamp was present
  const today = aggregates.filter(t => !t.createdAtMs || t.createdAtMs >= sinceMs);
  // de-duplicate
  const uniq = new Map<string, DiscoveredToken>();
  for (const t of today) uniq.set(t.mint, t);
  return { today: Array.from(uniq.values()) };
}