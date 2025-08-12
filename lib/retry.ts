export const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms));

export async function fetchTextRetry(input: string|URL, init: RequestInit = {}, {
  retries = 3, timeoutMs = 20000, backoffMs = 600,
  shouldRetry = (s:number, body:string)=> s===429 || s===408 || s===502 || s===503 || s===504
} = {}) {
  let attempt = 0;
  while (true) {
    attempt++;
    const ctl = new AbortController();
    const t = setTimeout(()=>ctl.abort(), timeoutMs);
    try {
      const res = await fetch(input.toString(), { ...init, signal: ctl.signal, cache: "no-store" });
      const raw = await res.text();
      if (!res.ok) {
        if (attempt <= retries && shouldRetry(res.status, raw)) {
          await sleep(backoffMs * attempt * attempt);
          continue;
        }
        throw new Error(`${res.status}: ${raw.slice(0,200)}`);
      }
      return raw;
    } catch (e:any) {
      const transient = /aborted|timeout|socket|network/i.test(String(e?.message||e));
      if (attempt <= retries && transient) { await sleep(backoffMs * attempt * attempt); continue; }
      throw e;
    } finally { clearTimeout(t); }
  }
}

export async function fetchJsonRetry(input: string|URL, init?: RequestInit, opts?: any) {
  const raw = await fetchTextRetry(input, init, opts);
  try { return JSON.parse(raw); } catch { throw new Error(`Invalid JSON: ${raw.slice(0,160)}`); }
}