import { env, okJson, badJson, asArray } from "@/lib/env";
import { fetchJsonRetry, fetchTextRetry, sleep } from "@/lib/retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BAGS_API_KEY = () => env("BAGS_API_KEY");
const HELIUS = () => env("HELIUS_API_KEY");

async function fetchBagsCreators(pages = 5, limit = 100) {
  const out: any[] = [];
  let page = 0;

  for (let i = 0; i < pages; i++) {
    const url = `https://api.bags.fm/api/v1/token-launch/creator/v2?page=${page}&limit=${limit}`;
    const headers = { "x-api-key": BAGS_API_KEY() };
    
    try {
      const data = await fetchJsonRetry(url, { headers }, { retries: 3, timeoutMs: 15000 });
      const items = asArray(data?.data);
      if (items.length === 0) break;
      
      out.push(...items);
      page++;
      await sleep(100);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (/429|502|503|504|timeout|aborted|socket/i.test(msg)) {
        await sleep(500);
        i--;
        continue;
      }
      throw e;
    }
  }
  return out;
}

export async function GET(req: Request) {
  try {
    if (!BAGS_API_KEY()) return badJson("Missing BAGS_API_KEY", 500);

    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").trim();
    if (!wallet) return badJson("Provide ?wallet=<wallet_address>", 400);

    // Fetch creators from Bags.fm
    const creators = await fetchBagsCreators(5, 100);
    
    // Find matching Twitter handles for the wallet
    const matches = creators.filter(creator => 
      creator?.wallet === wallet || 
      creator?.feeWallet === wallet ||
      creator?.creatorWallet === wallet
    );

    const twitterHandles = matches
      .map(match => match?.twitter)
      .filter(Boolean)
      .filter((handle, index, arr) => arr.indexOf(handle) === index); // Remove duplicates

    return okJson({ 
      ok: true, 
      input: { wallet }, 
      twitterHandles,
      matchCount: matches.length,
      totalCreators: creators.length
    });
  } catch (e: any) {
    return badJson(`Wallet to Twitter lookup failed: ${e?.message || String(e)}`, 502);
  }
}