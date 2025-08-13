import { NextResponse } from "next/server";
import { fetchTextRetry } from "@/lib/retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ""}`;

async function heliusRpc(method: string, params: any) {
  if (!process.env.HELIUS_API_KEY) throw new Error("Missing HELIUS_API_KEY");
  const raw = await fetchTextRetry(HELIUS_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "bags", method, params }),
  });
  let j: any;
  try { j = JSON.parse(raw); } catch { throw new Error(`Invalid JSON: ${raw.slice(0,200)}`); }
  if (j.error) throw new Error(j.error.message || "RPC error");
  return j.result;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const address = (url.searchParams.get("address") || "").trim();
    if (!address) return NextResponse.json({ ok:false, error:"Missing ?address" }, { status:400 });

    // 1) SOL баланс
    const bal = await heliusRpc("getBalance", [address]);
    const sol = (bal?.value ?? 0) / 1e9;

    // 2) Топ токены по владельцу
    const assets = await heliusRpc("getAssetsByOwner", { ownerAddress: address, page: 1, limit: 500 });
    const list = Array.isArray(assets?.items || assets?.result || assets)
      ? (assets.items || assets.result || assets)
      : [];

    type Row = { mint: string; symbol: string | null; displayBalance: number | null };
    const tokens: Row[] = [];

    for (const a of list) {
      const iface = a?.interface || a?.interfaceType;
      if (iface !== "FungibleToken") continue;

      const mint = a?.id || a?.mint || a?.token?.mint || null;
      const symbol = a?.token_info?.symbol ?? a?.tokenInfo?.symbol ?? null;
      const decimals = a?.token_info?.decimals ?? a?.tokenInfo?.decimals ?? null;
      const rawBal =
        a?.token_info?.balance ?? a?.tokenInfo?.balance ??
        a?.ownership?.tokenAmount ?? a?.token?.amount ?? null;

      let displayBalance: number | null = null;
      if (typeof rawBal === "number" && typeof decimals === "number" && decimals >= 0) {
        displayBalance = rawBal / Math.pow(10, decimals);
      }

      if (mint) tokens.push({ mint, symbol, displayBalance });
    }

    const topTokens = tokens
      .filter(t => typeof t.displayBalance === "number" && (t.displayBalance as number) > 0)
      .sort((a, b) => (b.displayBalance! - a.displayBalance!))
      .slice(0, 3);

    return NextResponse.json({
      ok: true,
      address,
      solBalance: Number(sol.toFixed(6)),
      topTokens,
    });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || String(e) }, { status: 500 });
  }
}