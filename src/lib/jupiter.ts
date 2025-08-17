import { fetchJson } from './http';

type JupPrice = { data: Record<string, { id: string; price: number }> };

export async function getJupPriceUsd(mint: string): Promise<number | null> {
  try {
    const url = `https://price.jup.ag/v6/price?ids=${encodeURIComponent(mint)}`;
    const data = await fetchJson<JupPrice>(url);
    const p = data?.data?.[mint]?.price;
    return (typeof p === 'number' && Number.isFinite(p)) ? p : null;
  } catch { return null; }
}