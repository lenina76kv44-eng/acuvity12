export async function fetchJson<T=any>(url: string, init?: RequestInit, retries = 2, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, headers: { 'accept': 'application/json', ...(init?.headers||{}) } });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json() as T;
  } catch (e) {
    if (retries > 0) return fetchJson<T>(url, init, retries - 1, timeoutMs + 3000);
    throw e;
  } finally {
    clearTimeout(t);
  }
}

export const n = {
  f(v?: number | string, d = 2) {
    const x = typeof v === 'string' ? Number(v) : (v ?? 0);
    return isFinite(x) ? x.toLocaleString(undefined, { maximumFractionDigits: d }) : '—';
  }
};