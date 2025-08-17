export async function fetchJSON<T>(url: string, init: RequestInit = {}, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(id);
  }
}

export async function withRetry<T>(fn: () => Promise<T>, tries = 2, delayMs = 350): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { lastErr = e; if (i < tries-1) await new Promise(r => setTimeout(r, delayMs)); }
  }
  // @ts-expect-error
  throw lastErr;
}

// simple in-memory cache for server (survives route calls inside same process)
type CacheEntry<T> = { at: number; ttl: number; value: T };
const g: any = globalThis as any;
if (!g.__mem) g.__mem = new Map<string, CacheEntry<any>>();

export function getCache<T>(key: string): T | null {
  const hit = g.__mem.get(key) as CacheEntry<T> | undefined;
  if (!hit) return null;
  if (Date.now() - hit.at > hit.ttl) { g.__mem.delete(key); return null; }
  return hit.value;
}

export function setCache<T>(key: string, value: T, ttlMs: number) {
  g.__mem.set(key, { at: Date.now(), ttl: ttlMs, value });
}