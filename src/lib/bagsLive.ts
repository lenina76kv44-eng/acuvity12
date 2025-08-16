import { env } from '@/lib/env';

// We try Bags API first; if it fails, we fall back to Helius program scan.
// Both return an array of SPL mint addresses created/registered in the last N hours.
export async function getBagsMintsLastHours(hours = 24): Promise<string[]> {
  const bagsApiKey = env('BAGS_API_KEY');
  const bagsActorIds = env('BAGS_ACTOR_IDS');
  const bagsProgramIds = env('BAGS_PROGRAM_IDS');
  const heliusApiKey = env('HELIUS_API_KEY');

  const actors = bagsActorIds.split(',').map(s => s.trim()).filter(Boolean);
  const programs = bagsProgramIds.split(',').map(s => s.trim()).filter(Boolean);

  const since = new Date(Date.now() - hours * 3600_000).toISOString();

  // ---- Attempt 1: Bags API (preferred)
  if (bagsApiKey) {
    try {
      const url = new URL('https://public-api-v2.bags.fm/api/v1/token-launch/recent'); // Adjusted endpoint based on project files
      url.searchParams.set('since', since);
      // Bags API doesn't seem to support actorIds/programIds in this endpoint,
      // so we'll rely on the default behavior or filter later if needed.

      const r = await fetch(url.toString(), {
        headers: { 'x-api-key': bagsApiKey, 'accept': 'application/json' },
        cache: 'no-store',
      });

      if (r.ok) {
        const j = await r.json();
        // Expecting items like { tokenMint: string, ... }. Map defensively.
        const mints = (Array.isArray(j?.response) ? j.response : []) // Adjusted based on project files
          .map((it: any) => String(it?.tokenMint || ''))
          .filter((m: string) => m.length > 10);
        if (mints.length) return [...new Set(mints)];
      }
    } catch (e) {
      console.warn("Bags API fetch failed, falling back to Helius:", e);
    }
  } else {
    console.warn("BAGS_API_KEY not set, falling back to Helius for mint discovery.");
  }


  // ---- Attempt 2: Helius program scan (fallback)
  // We scan recent transactions for provided programIds and extract SPL mints
  // from enhanced events.mint + tokenTransfers to guess the token mint.
  if (!heliusApiKey) {
    console.error("HELIUS_API_KEY not set. Cannot perform Helius fallback scan.");
    return [];
  }

  const found = new Set<string>();
  const until = Math.floor(Date.now()/1000);
  const sinceTs = until - hours * 3600;

  // helper: fetch txs for a program with pagination
  async function fetchProgram(program: string) {
    let before: string | undefined = undefined;
    for (let page=0; page<8; page++) { // Limit pages to avoid excessive calls
      const u = new URL(`https://api.helius.xyz/v0/addresses/${program}/transactions`);
      u.searchParams.set('api-key', heliusApiKey);
      u.searchParams.set('limit', '100');
      if (before) u.searchParams.set('before', before);
      const r = await fetch(u.toString(), { cache: 'no-store' });
      if (!r.ok) break;
      const arr = await r.json().catch(()=>[]);
      if (!Array.isArray(arr) || arr.length===0) break;

      for (const tx of arr) {
        const ts = Number(tx?.timestamp || 0);
        if (!ts || ts < sinceTs) return; // older than window — stop this program
        // prefer enhanced mint events
        const mints = Array.isArray(tx?.events?.mint) ? tx.events.mint : [];
        for (const m of mints) {
          const mint = String(m?.mint || '');
          if (mint && mint.length>10) found.add(mint);
        }
        // fallback: tokenTransfers that look like new-asset distribution
        const tt = Array.isArray(tx?.tokenTransfers) ? tx.tokenTransfers : [];
        tt.forEach((t:any)=>{
          const mint = String(t?.mint || '');
          if (mint && mint.length>10) found.add(mint);
        });
      }
      before = arr[arr.length-1]?.signature;
      if (!before) break;
    }
  }

  if (programs.length === 0) {
    console.warn("BAGS_PROGRAM_IDS not set. Helius fallback might not find relevant tokens.");
  }

  for (const p of programs) {
    try { await fetchProgram(p); } catch (e) {
      console.error(`Error fetching Helius program ${p}:`, e);
    }
  }
  return [...found];
}