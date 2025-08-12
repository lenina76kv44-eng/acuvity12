// lib/retry.ts
export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function fetchTextRetry(
  input: string | URL,
  init: RequestInit = {},
  {
    retries = 3,
    timeoutMs = 20000,
    backoffMs = 600,
    shouldRetry = (status: number, body: string) =>
      status === 429 || status === 408 || status === 502 || status === 503 || status === 504
  }: {
    retries?: number;
    timeoutMs?: number;
    backoffMs?: number;
    shouldRetry?: (status: number, body: string) => boolean;
  } = {}
) {
  let attempt = 0;
  while (true) {
    attempt++;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(input.toString(), { ...init, signal: controller.signal, cache: "no-store" });
      const raw = await res.text();
      if (!res.ok) {
        if (attempt <= retries && shouldRetry(res.status, raw)) {
          await sleep(backoffMs * attempt * attempt);
          continue;
        }
        throw new Error(`${res.status}: ${raw.slice(0,200)}`);
      }
      return raw;
    } catch (e: any) {
      const msg = String(e?.message || e);
      const transient = /aborted|timeout|fetch failed|network|socket/i.test(msg);
      if (attempt <= retries && transient) {
        await sleep(backoffMs * attempt * attempt);
        continue;
      }
      throw new Error(msg);
    } finally {
      clearTimeout(t);
    }
  }
}

export async function fetchJsonRetry(input: string | URL, init?: RequestInit, opts?: Parameters<typeof fetchTextRetry>[2]) {
  const raw = await fetchTextRetry(input, init, opts);
  try { return JSON.parse(raw); } catch { throw new Error(`Invalid JSON: ${raw.slice(0,160)}`); }
}