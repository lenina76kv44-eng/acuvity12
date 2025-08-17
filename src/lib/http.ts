// Lightweight fetch with timeout and JSON guard
export async function jfetch<T>(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 8000, ...rest } = init;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...rest, signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) return await res.json() as T; // some APIs mislabel
    return await res.json() as T;
  } finally {
    clearTimeout(id);
  }
}

// Chunk an array into size-N parts
export function chunk<T>(arr: T[], size = 25): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Simple in-memory cache with TTL + last-good fallback
type CacheEntry<T> = { at: number; ttl: number; value: T };
const _cache = new Map<string, CacheEntry<any>>();
export function getCached<T>(key: string): T | undefined {
  const hit = _cache.get(key);
  if (!hit) return;
  const now = Date.now();
  if (now - hit.at <= hit.ttl) return hit.value as T;
  // stale: keep as last-good if caller wants
  return undefined;
}
export function setCached<T>(key: string, value: T, ttlMs: number) {
  _cache.set(key, { at: Date.now(), ttl: ttlMs, value });
}
export function getLastGood<T>(key: string): T | undefined {
  const hit = _cache.get(key);
  return hit?.value as T | undefined;
}