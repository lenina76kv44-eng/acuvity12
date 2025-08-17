// src/lib/http.ts
type CacheEntry<T> = { at: number; ttl: number; value: T };
const g: any = globalThis as any;
if (!g.__mem) g.__mem = new Map<string, CacheEntry<any>>();

export function setCache<T>(k: string, v: T, ttlMs: number) { g.__mem.set(k, { at: Date.now(), ttl: ttlMs, value: v }); }
export function getCache<T>(k: string): T | null {
  const e = g.__mem.get(k) as CacheEntry<T> | undefined;
  if (!e) return null; if (Date.now() - e.at > e.ttl) { g.__mem.delete(k); return null; } return e.value;
}

export async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export function num(x: any) {
  if (typeof x === 'number') return x;
  if (typeof x === 'string') return Number(x.replace(/[$,]/g, '')) || 0;
  return 0;
}