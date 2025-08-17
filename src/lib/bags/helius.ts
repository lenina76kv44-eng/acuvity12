import { BAGS_ENV } from "@/src/env/env.bags.mjs";

export type HeliusTx = {
  signature: string;
  timestamp: number;
  tokenTransfers?: Array<{ mint: string; tokenAmount: number; tokenStandard?: string }>;
  events?: any;
};

const BASE = `https://api.helius.xyz/v0/addresses`;

export async function fetchBagsMintsSince(sinceUnixSec: number): Promise<string[]> {
  const apiKey = BAGS_ENV.HELIUS_API_KEY;
  if (!apiKey) throw new Error("Missing HELIUS_API_KEY");
  
  const mints = new Set<string>();

  // Iterate programs that Bags uses
  for (const program of BAGS_ENV.BAGS_PROGRAM_IDS) {
    let before: string | undefined = undefined;
    // page through recent txs (stop when older than 'since')
    for (let page = 0; page < 10; page++) {
      const url = new URL(`${BASE}/${program}/transactions`);
      url.searchParams.set("api-key", apiKey);
      url.searchParams.set("limit", "100");
      if (before) url.searchParams.set("before", before);
      
      const res = await fetch(url.toString(), { next: { revalidate: 60 } });
      if (!res.ok) break;
      const txs: HeliusTx[] = await res.json();
      if (!txs.length) break;

      for (const tx of txs) {
        if (tx.timestamp < sinceUnixSec) { 
          // older page – stop paging this program
          page = 999; 
          break;
        }
        // Heuristic: new fungible mint shows up as tokenTransfers with tiny supply then LP created,
        // or in events.metadata/mint. Collect all distinct mint addresses seen.
        if (tx.events?.metadata?.mint) mints.add(tx.events.metadata.mint);
        if (tx.tokenTransfers) {
          for (const t of tx.tokenTransfers) {
            if (t.mint && (t.tokenStandard?.includes("Fungible") || t.tokenStandard?.includes("FungibleAsset"))) {
              mints.add(t.mint);
            }
          }
        }
      }
      before = txs[txs.length - 1]?.signature;
    }
  }
  return [...mints];
}