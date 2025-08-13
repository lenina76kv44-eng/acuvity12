import { env, okJson, badJson, asArray } from "@/lib/env";
import { fetchJsonRetry, fetchTextRetry, sleep } from "@/lib/retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS = () => env("HELIUS_API_KEY");

async function fetchAddressPage(addr: string, before: string | undefined, limit: number) {
  const u = new URL(`https://api.helius.xyz/v0/addresses/${addr}/transactions`);
  u.searchParams.set("api-key", HELIUS());
  u.searchParams.set("limit", String(limit));
  if (before) u.searchParams.set("before", before);
  return fetchJsonRetry(u.toString(), {}, { retries: 3, timeoutMs: 20000 });
}

export async function GET(req: Request) {
  try {
    if (!HELIUS()) return badJson("Missing HELIUS_API_KEY", 500);

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "txs";

    if (mode === "txs") {
      const address = (url.searchParams.get("address") || "").trim();
      const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "100", 10)));
      const before = url.searchParams.get("before") || undefined;
      if (!address) return badJson("Provide ?address=", 400);
      const arr = await fetchAddressPage(address, before, limit);
      return okJson(arr);
    }

    if (mode === "das-batch") {
      const ids = url.searchParams.getAll("id").filter(Boolean);
      if (!ids.length) return badJson("Provide ?id=<mint>&id=<mint2>…", 400);
      const body = { jsonrpc: "2.0", id: "bagsfinder", method: "getAssetBatch", params: { ids } };
      const j = await fetchJsonRetry<any>(
        `https://mainnet.helius-rpc.com/?api-key=${HELIUS()}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
        { retries: 2, timeoutMs: 15000 }
      );
      return okJson(asArray((j as any)?.result));
    }

    return badJson("Unknown mode (use mode=txs or mode=das-batch)", 400);
  } catch (e: any) {
    return badJson(`Helius proxy failed: ${e?.message || String(e)}`, 502);
  }
}