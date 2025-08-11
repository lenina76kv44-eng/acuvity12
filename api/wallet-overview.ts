import type { VercelRequest, VercelResponse } from "@vercel/node";

const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

async function heliusRpc(method: string, params: any) {
  const r = await fetch(HELIUS_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "bags", method, params }),
  });
  const raw = await r.text();
  if (!r.ok) throw new Error(`${r.status}: ${raw.slice(0,200)}`);
  let j: any; try { j = JSON.parse(raw); } catch { throw new Error(`Invalid JSON: ${raw.slice(0,200)}`); }
  if (j.error) throw new Error(j.error.message || "RPC error");
  return j.result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const address = String(req.query.address || "").trim();
    if (!address) return res.status(400).json({ ok:false, error:"Missing ?address" });
    if (!process.env.HELIUS_API_KEY) return res.status(500).json({ ok:false, error:"Missing HELIUS_API_KEY" });

    // 1) SOL баланс (лампорты → SOL)
    const bal = await heliusRpc("getBalance", [address]);
    const sol = (bal?.value ?? 0) / 1e9;

    // 2) Топ токены через DAS getAssetsByOwner (может не всегда давать баланс — обрабатываем аккуратно)
    const assets = await heliusRpc("getAssetsByOwner", { ownerAddress: address, page: 1, limit: 500 });
    const list = Array.isArray(assets?.items || assets?.result || assets) ? (assets.items || assets.result || assets) : [];

    type Row = { mint: string; symbol: string | null; displayBalance: number | null };
    const tokens: Row[] = [];

    for (const a of list) {
      const iface = a?.interface || a?.interfaceType;
      if (iface !== "FungibleToken") continue;

      const mint = a?.id || a?.mint || a?.token?.mint || null;
      const symbol = a?.token_info?.symbol ?? a?.tokenInfo?.symbol ?? null;
      const decimals = a?.token_info?.decimals ?? a?.tokenInfo?.decimals ?? null;

      // возможные поля с балансом (зависят от формата ответа)
      const rawBal =
        a?.token_info?.balance ?? a?.tokenInfo?.balance ??
        a?.ownership?.tokenAmount ??
        a?.token?.amount ?? null;

      let displayBalance: number | null = null;
      if (typeof rawBal === "number" && typeof decimals === "number" && decimals >= 0) {
        displayBalance = rawBal / Math.pow(10, decimals);
      }

      if (mint) tokens.push({ mint, symbol, displayBalance });
    }

    // сортируем по displayBalance, берём топ-3
    const topTokens = tokens
      .filter(t => typeof t.displayBalance === "number" && (t.displayBalance as number) > 0)
      .sort((a, b) => (b.displayBalance! - a.displayBalance!))
      .slice(0, 3);

    return res.json({
      ok: true,
      address,
      solBalance: Number(sol.toFixed(6)),
      topTokens
    });
  } catch (e: any) {
    return res.status(500).json({ ok:false, error: e?.message || String(e) });
  }
}