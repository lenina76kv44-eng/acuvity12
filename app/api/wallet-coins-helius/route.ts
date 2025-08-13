import { env, okJson, badJson, asArray } from "@/lib/env";
import { fetchTextRetry } from "@/lib/retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS = () => env("HELIUS_API_KEY");

export async function GET(req: Request) {
  try {
    if (!HELIUS()) return badJson("Missing HELIUS_API_KEY", 500);

    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").trim();
    if (!wallet) return badJson("Provide ?wallet=<wallet_address>", 400);

    // Use internal helius-proxy instead of direct call
    const proxyUrl = new URL('/api/helius-proxy', url.origin);
    proxyUrl.searchParams.set('mode', 'das-batch');
    
    // First get token accounts
    const body = {
      jsonrpc: "2.0",
      id: "bagsfinder", 
      method: "getTokenAccountsByOwner",
      params: [
        wallet,
        { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { encoding: "jsonParsed" }
      ]
    };

    const txt = await fetchTextRetry(
      `https://mainnet.helius-rpc.com/?api-key=${HELIUS()}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      },
      { retries: 3, timeoutMs: 15000 }
    );

    const response = JSON.parse(txt);
    const tokenAccounts = asArray(response?.result?.value);
    
    const tokens = tokenAccounts
      .map((account: any) => {
        const info = account?.account?.data?.parsed?.info;
        return {
          mint: info?.mint,
          balance: info?.tokenAmount?.uiAmount || 0,
          decimals: info?.tokenAmount?.decimals || 0
        };
      })
      .filter(token => token.mint && token.balance > 0);

    return okJson({
      ok: true,
      input: { wallet },
      tokens,
      count: tokens.length
    });
  } catch (e: any) {
    return badJson(`Helius wallet coins failed: ${e?.message || String(e)}`, 502);
  }
}