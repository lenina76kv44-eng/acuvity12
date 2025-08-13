import { env, okJson, badJson, asArray } from "@/lib/env";
import { fetchJsonRetry, fetchTextRetry, sleep } from "@/lib/retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS = () => env("HELIUS_API_KEY");
const BAGS_MINT_SUFFIX = () => env("BAGS_MINT_SUFFIX");

async function fetchWalletTokens(wallet: string) {
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

  try {
    const response = JSON.parse(txt);
    return asArray(response?.result?.value);
  } catch {
    return [];
  }
}

async function enrichTokenMetadata(mints: string[]) {
  if (mints.length === 0) return [];

  const body = {
    jsonrpc: "2.0",
    id: "bagsfinder",
    method: "getAssetBatch",
    params: { ids: mints.slice(0, 100) }
  };

  try {
    const txt = await fetchTextRetry(
      `https://mainnet.helius-rpc.com/?api-key=${HELIUS()}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      },
      { retries: 2, timeoutMs: 15000 }
    );

    const response = JSON.parse(txt);
    return asArray(response?.result);
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  try {
    if (!HELIUS()) return badJson("Missing HELIUS_API_KEY", 500);

    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").trim();
    if (!wallet) return badJson("Provide ?wallet=<wallet_address>", 400);

    // Fetch token accounts
    const tokenAccounts = await fetchWalletTokens(wallet);
    
    // Extract mints and filter for BAGS tokens
    const suffix = BAGS_MINT_SUFFIX();
    const allMints = tokenAccounts
      .map((account: any) => account?.account?.data?.parsed?.info?.mint)
      .filter(Boolean);
    
    const bagsMints = allMints.filter((mint: string) => 
      suffix ? mint.endsWith(suffix) : true
    );

    // Enrich with metadata
    const metadata = await enrichTokenMetadata(bagsMints);
    
    // Combine token data with metadata
    const enrichedTokens = bagsMints.map((mint: string) => {
      const meta = metadata.find((m: any) => m?.id === mint);
      const account = tokenAccounts.find((acc: any) => 
        acc?.account?.data?.parsed?.info?.mint === mint
      );
      
      return {
        mint,
        balance: account?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0,
        name: meta?.content?.metadata?.name || "Unknown",
        symbol: meta?.content?.metadata?.symbol || "???",
        image: meta?.content?.files?.[0]?.uri || null,
        description: meta?.content?.metadata?.description || null
      };
    });

    return okJson({
      ok: true,
      input: { wallet },
      tokens: enrichedTokens,
      totalTokens: allMints.length,
      bagsTokens: bagsMints.length
    });
  } catch (e: any) {
    return badJson(`Wallet coins lookup failed: ${e?.message || String(e)}`, 502);
  }
}