import { env, okJson, badJson } from "@/lib/env";
import { fetchTextRetry } from "@/lib/retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS = () => env("HELIUS_API_KEY");

async function getWalletBalance(wallet: string) {
  const body = {
    jsonrpc: "2.0",
    id: "bagsfinder",
    method: "getBalance",
    params: [wallet]
  };

  const txt = await fetchTextRetry(
    `https://mainnet.helius-rpc.com/?api-key=${HELIUS()}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    },
    { retries: 3, timeoutMs: 10000 }
  );

  try {
    const response = JSON.parse(txt);
    const lamports = response?.result?.value || 0;
    return lamports / 1e9; // Convert to SOL
  } catch {
    return 0;
  }
}

export async function GET(req: Request) {
  try {
    if (!HELIUS()) return badJson("Missing HELIUS_API_KEY", 500);

    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").trim();
    if (!wallet) return badJson("Provide ?wallet=<wallet_address>", 400);

    const solBalance = await getWalletBalance(wallet);

    return okJson({
      ok: true,
      input: { wallet },
      solBalance,
      timestamp: Date.now()
    });
  } catch (e: any) {
    return badJson(`Wallet overview failed: ${e?.message || String(e)}`, 502);
  }
}