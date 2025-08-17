import { getEnhancedTxs } from './helius';

const PROGRAMS = (process.env.BAGS_PROGRAM_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

// Extract unique mints where type === "MINT" in tokenTransfers within the tx time window.
export async function discoverBagsMints24h(): Promise<string[]> {
  const endSec = Math.floor(Date.now() / 1000);
  const startSec = endSec - 24*60*60;

  const results = await Promise.allSettled(PROGRAMS.map(p => getEnhancedTxs(p, startSec, endSec)));
  const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  const set = new Set<string>();
  for (const tx of all) {
    for (const t of (tx.tokenTransfers || [])) {
      const mint = t.tokenAddress || t.mint;
      if (!mint) continue;
      // Only treat as "creation-context" if it was a MINT event
      if ((t.type || '').toUpperCase() === 'MINT') set.add(mint);
    }
  }
  return [...set];
}