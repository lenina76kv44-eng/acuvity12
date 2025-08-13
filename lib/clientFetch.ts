export async function getJson<T=any>(url: string) {
  const r = await fetch(url, { method: "GET", headers: { "accept": "application/json" }, cache: "no-store" });
  const txt = await r.text();
  if (!r.ok) throw new Error(txt || `HTTP ${r.status}`);
  try { return JSON.parse(txt) as T; } catch { return {} as T; }
}