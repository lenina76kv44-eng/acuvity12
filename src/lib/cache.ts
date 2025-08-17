type Entry<T> = { value: T; expires: number };
const store = new Map<string, Entry<any>>();

export function getCache<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) { store.delete(key); return null; }
  return hit.value as T;
}
export function setCache<T>(key: string, value: T, ttlMs: number) {
  store.set(key, { value, expires: Date.now() + ttlMs });
}