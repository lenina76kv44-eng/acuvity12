import { env, okJson, badJson, asArray } from "@/lib/env";
import { fetchJsonRetry, fetchTextRetry, sleep } from "@/lib/retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS = () => env("HELIUS_API_KEY");

type Tx = any;

const STABLE = new Set([
  "So11111111111111111111111111111111111111112", // wSOL
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"  // USDT
]);

async function fetchAddressPage(addr: string, before: string | undefined, limit: number) {
  const u = new URL(`https://api.helius.xyz/v0/addresses/${addr}/transactions`);
  u.searchParams.set("api-key", HELIUS());
  u.searchParams.set("limit", String(limit));
  if (before) u.searchParams.set("before", before);
  return fetchJsonRetry(u, {}, { retries: 3, timeoutMs: 20000 });
}

// sequential per wallet with adaptive throttling
async function fetchPagesSafe(addr: string, pages: number, limit: number) {
  const out: any[] = [];
  let before: string | undefined;
  let lim = limit;
  for (let i = 0; i < pages; i++) {
    try {
      const arr = await fetchAddressPage(addr, before, lim);
      if (!Array.isArray(arr) || arr.length === 0) break;
      out.push(...arr);
      before = arr[arr.length - 1]?.signature;
      if (!before) break;
      await sleep(120); // tiny pace to reduce 504s
    } catch (e: any) {
      const msg = String(e?.message || e);
      // degrade on heavy endpoints
      if (/^(429|502|503|504)/.test(msg) || /timeout|aborted/i.test(msg)) {
        // try shallower scan
        if (lim > 75) lim = 75;
        else if (lim > 50) lim = 50;
        else { /* keep */ }
        await sleep(400);
        i--; // retry same page with smaller limit
        continue;
      }
      throw e;
    }
  }
  return out;
}

// more tolerant acquisition heuristic
function acquiredMints(wallet: string, tx: any) {
  const m = new Set<string>();
  const tt = asArray(tx?.tokenTransfers);
  const swaps = tx?.events?.swap ? [tx.events.swap] : [];
  const userIsBuyer = swaps.some((s: any) => s?.user === wallet);
  
  if (userIsBuyer) {
    tt.forEach((t: any) => {
      if ((t?.toUserAccount === wallet || t?.toUserAccountOwner === wallet) && t?.mint && !STABLE.has(t.mint)) {
        m.add(String(t.mint));
      }
    });
  } else {
    // fallback: incoming non-stable + outgoing native or stable in same tx
    const incoming = tt.filter((t:any)=> 
      (t?.toUserAccount === wallet || t?.toUserAccountOwner === wallet) && 
      t?.mint && !STABLE.has(t.mint)
    );
    const paid = tt.some((t:any)=> 
      (t?.fromUserAccount === wallet || t?.fromUserAccountOwner === wallet) && 
      (STABLE.has(t?.mint) || t?.mint === null) // native SOL sometimes null
    );
    // also ignore obvious mint-by-self cases
    if (incoming.length && paid) {
      incoming.forEach((t:any)=> m.add(String(t.mint)));
    }
  }
  return [...m];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawAddrs = (url.searchParams.get("addresses") || "").trim();
  const pages = Math.max(1, Math.min(10, parseInt(url.searchParams.get("pages") || "5", 10)));
  const limit = Math.max(1, Math.min(1000, parseInt(url.searchParams.get("limit") || "100", 10)));
  const withMeta = url.searchParams.get("meta") === "1";

  if (!HELIUS()) return badJson("Missing HELIUS_API_KEY", 500);
  const addrs = rawAddrs.split(/[\s,\n]+/).map(s=>s.trim()).filter(Boolean);
  if (addrs.length < 2 || addrs.length > 10) return badJson("Provide 2–10 addresses via ?addresses=");

  try {
    // fetch per wallet sequentially to avoid global 504s
    const per: Record<string, Set<string>> = {};
    const examples: Record<string, any[]> = {};
    
    for (const a of addrs) {
      const txs = await fetchPagesSafe(a, pages, limit);
      const set = new Set<string>();
      txs.forEach(tx => {
        const bought = acquiredMints(a, tx);
        bought.forEach(m => {
          set.add(m);
          
          // Store examples for later
          if (!examples[m]) examples[m] = [];
          if (examples[m].length < 3) {
            examples[m].push({
              tx: tx?.signature || "",
              time: tx?.timestamp || 0
            });
          }
        });
      });
      per[a] = set;
    }

    // Shared aggregation
    const shared: Record<string, Set<string>> = {};
    
    for (const a of addrs) {
      per[a].forEach(m => {
        if (!shared[m]) shared[m] = new Set<string>();
        shared[m].add(a);
      });
    }

    const list = Object.entries(shared)
      .map(([mint, ws]) => ({ 
        mint, 
        count: ws.size, 
        wallets: [...ws], 
        examples: examples[mint] || []
      }))
      .filter(x => x.count >= 2)
      .sort((a,b)=> b.count - a.count || a.mint.localeCompare(b.mint));

    // Optionally enrich with DAS meta
    if (withMeta && list.length) {
      const ids = list.map(x => x.mint).slice(0, 100);
      const body = {
        jsonrpc: "2.0", id: "bagsfinder", method: "getAssetBatch",
        params: { ids }
      };
      try {
        const raw = await fetchTextRetry(`https://mainnet.helius-rpc.com/?api-key=${HELIUS()}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body)
        }, { retries: 2, timeoutMs: 15000 });
        const j = JSON.parse(raw);
        const arr = asArray(j?.result);
        const metaById: Record<string, any> = {};
        arr.forEach((it:any) => {
          const id = it?.id;
          const name = it?.content?.metadata?.name || null;
          const symbol = it?.content?.metadata?.symbol || null;
          const image = it?.content?.links?.image || null;
          if (id) metaById[id] = { name, symbol, image };
        });
        list.forEach(row => {
          if (metaById[row.mint]) {
            (row as any).meta = metaById[row.mint];
          }
        });
      } catch (e) {
        // Meta enrichment is optional, continue without it
        console.warn("Meta enrichment failed:", e);
      }
    }

    return okJson({
      ok: true,
      input: { addresses: addrs, pages, limit },
      found: list.length,
      list
    });
  } catch (e: any) {
    return badJson(`Analysis failed: ${e.message || String(e)}`, 500);
  }
}