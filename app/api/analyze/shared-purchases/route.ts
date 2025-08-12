import { env, okJson, badJson, asArray } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS = () => env("HELIUS_API_KEY");

type Tx = any;

async function fetchPages(addr: string, pages: number, limit: number) {
  const out: Tx[] = [];
  let before: string | undefined;
  for (let i = 0; i < pages; i++) {
    const url = new URL(`https://api.helius.xyz/v0/addresses/${addr}/transactions`);
    url.searchParams.set("api-key", HELIUS());
    url.searchParams.set("limit", String(limit));
    if (before) url.searchParams.set("before", before);
    const r = await fetch(url.toString(), { cache: "no-store" });
    const raw = await r.text();
    if (!r.ok) throw new Error(`Helius ${r.status}: ${raw.slice(0,180)}`);
    let arr: Tx[];
    try { arr = JSON.parse(raw); } catch { throw new Error(`Invalid JSON from Helius`); }
    if (!Array.isArray(arr) || arr.length === 0) break;
    out.push(...arr);
    before = arr[arr.length - 1]?.signature;
    if (!before) break;
  }
  return out;
}

const STABLE = new Set([
  "So11111111111111111111111111111111111111112", // wSOL
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"  // USDT
]);

function detectBoughtMints(wallet: string, tx: Tx): string[] {
  const mints = new Set<string>();
  const tt = asArray(tx?.tokenTransfers);
  const swaps = tx?.events?.swap ? [tx.events.swap] : [];
  const userIsBuyer = swaps.some((s: any) => s?.user === wallet);
  
  if (userIsBuyer) {
    tt.forEach((t: any) => {
      if ((t?.toUserAccount === wallet || t?.toUserAccountOwner === wallet) && t?.mint && !STABLE.has(t.mint)) {
        mints.add(String(t.mint));
      }
    });
  } else {
    const incoming = tt.filter((t:any)=> 
      (t?.toUserAccount === wallet || t?.toUserAccountOwner === wallet) && 
      t?.mint && !STABLE.has(t.mint)
    );
    const paid = tt.some((t:any)=> 
      (t?.fromUserAccount === wallet || t?.fromUserAccountOwner === wallet) && 
      STABLE.has(t?.mint)
    );
    if (incoming.length && paid) {
      incoming.forEach((t:any)=> mints.add(String(t.mint)));
    }
  }
  return [...mints];
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
    // Per-wallet bought mints
    const per: Record<string, Set<string>> = {};
    for (const a of addrs) {
      const txs = await fetchPages(a, pages, limit);
      const set = new Set<string>();
      txs.forEach(tx => {
        const bought = detectBoughtMints(a, tx);
        bought.forEach(m => set.add(m));
        
        // Store examples for later
        if (bought.length > 0) {
          bought.forEach(mint => {
            if (!per[`${a}_examples`]) per[`${a}_examples`] = new Set();
            per[`${a}_examples`].add(JSON.stringify({
              mint,
              tx: tx?.signature || "",
              time: tx?.timestamp || 0
            }));
          });
        }
      });
      per[a] = set;
    }

    // Shared aggregation
    const shared: Record<string, Set<string>> = {};
    const examples: Record<string, any[]> = {};
    
    for (const a of addrs) {
      per[a].forEach(m => {
        if (!shared[m]) shared[m] = new Set<string>();
        shared[m].add(a);
        
        // Collect examples
        if (!examples[m]) examples[m] = [];
        const exampleKey = `${a}_examples`;
        if (per[exampleKey]) {
          per[exampleKey].forEach((exStr: any) => {
            try {
              const ex = JSON.parse(exStr);
              if (ex.mint === m && examples[m].length < 3) {
                examples[m].push({ tx: ex.tx, time: ex.time });
              }
            } catch {}
          });
        }
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
      const r = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS()}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          jsonrpc: "2.0", id: "bagsfinder", method: "getAssetBatch",
          params: { ids }
        })
      });
      const raw = await r.text();
      if (r.ok) {
        try {
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
              row.meta = metaById[row.mint];
            }
          });
        } catch {}
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