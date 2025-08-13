import { env, okJson, badJson, asArray } from "@/lib/env";
import { fetchJsonRetry, fetchTextRetry, sleep } from "@/lib/retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BAGS_API_KEY = () => env("BAGS_API_KEY");
const BAGS_ACTOR_IDS = () => env("BAGS_ACTOR_IDS");
const BAGS_PROGRAM_IDS = () => env("BAGS_PROGRAM_IDS");
const HELIUS = () => env("HELIUS_API_KEY");

async function fetchBagsTwitterWallet(handle: string) {
  const url = `https://api.bags.fm/api/v1/token-launch/fee-share/wallet/twitter?twitter=${encodeURIComponent(handle)}`;
  const headers = { "x-api-key": BAGS_API_KEY() };
  return fetchJsonRetry(url, { headers }, { retries: 3, timeoutMs: 15000 });
}

async function fetchWalletTransactions(wallet: string, pages = 3, limit = 100) {
  const out: any[] = [];
  let before: string | undefined;
  let lim = limit;

  for (let i = 0; i < pages; i++) {
    const u = new URL(`https://api.helius.xyz/v0/addresses/${wallet}/transactions`);
    u.searchParams.set("api-key", HELIUS());
    u.searchParams.set("limit", String(lim));
    if (before) u.searchParams.set("before", before);

    try {
      const arr = await fetchJsonRetry<any[]>(u.toString(), {}, { retries: 3, timeoutMs: 20000 });
      if (!Array.isArray(arr) || arr.length === 0) break;
      out.push(...arr);
      before = arr[arr.length - 1]?.signature;
      await sleep(120);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (/429|502|503|504|timeout|aborted|socket/i.test(msg) && lim > 50) {
        lim = Math.max(40, Math.floor(lim * 0.7));
        i--; 
        await sleep(400); 
        continue;
      }
      throw e;
    }
  }
  return out;
}

function findBagsTokens(transactions: any[]) {
  const bagsTokens = new Set<string>();
  const actorIds = BAGS_ACTOR_IDS().split(',').map(id => id.trim());
  const programIds = BAGS_PROGRAM_IDS().split(',').map(id => id.trim());

  for (const tx of transactions) {
    // Check token transfers for BAGS tokens
    const tokenTransfers = asArray(tx?.tokenTransfers);
    for (const transfer of tokenTransfers) {
      if (transfer?.mint && transfer.mint.endsWith('BAGS')) {
        bagsTokens.add(transfer.mint);
      }
    }

    // Check account data for known BAGS programs/actors
    const accountData = asArray(tx?.accountData);
    for (const account of accountData) {
      if (account?.account && (
        actorIds.includes(account.account) || 
        programIds.includes(account.account)
      )) {
        // Look for associated token mints in the same transaction
        for (const transfer of tokenTransfers) {
          if (transfer?.mint) {
            bagsTokens.add(transfer.mint);
          }
        }
      }
    }
  }

  return Array.from(bagsTokens);
}

export async function GET(req: Request) {
  try {
    if (!BAGS_API_KEY()) return badJson("Missing BAGS_API_KEY", 500);
    if (!HELIUS()) return badJson("Missing HELIUS_API_KEY", 500);

    const url = new URL(req.url);
    const handle = (url.searchParams.get("handle") || "").trim().replace(/^@/, "");
    if (!handle) return badJson("Provide ?handle=<twitter_handle>", 400);

    // First try to get wallet from Bags.fm API
    let wallet = "";
    try {
      const bagsData = await fetchBagsTwitterWallet(handle);
      wallet = bagsData?.wallet || "";
    } catch (e: any) {
      // If Bags API fails, we can't proceed
      return badJson(`Bags API failed: ${e?.message || String(e)}`, 502);
    }

    if (!wallet) {
      return okJson({ ok: true, input: { handle }, wallet: null, bagsTokens: [] });
    }

    // Fetch wallet transactions to find BAGS tokens
    const transactions = await fetchWalletTransactions(wallet, 3, 100);
    const bagsTokens = findBagsTokens(transactions);

    return okJson({ 
      ok: true, 
      input: { handle }, 
      wallet, 
      bagsTokens,
      transactionCount: transactions.length 
    });
  } catch (e: any) {
    return badJson(`Twitter wallet lookup failed: ${e?.message || String(e)}`, 502);
  }
}