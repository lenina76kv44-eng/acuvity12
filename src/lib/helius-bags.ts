type HeliusTx = {
  signature: string;
  timestamp: number;
  instructions?: any[];
  events?: { token?: { mint?: string } };
};

const HELIUS_BASE = "https://mainnet.helius-rpc.com";

async function fetchJson(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    // no-cache to avoid stale when user hits Refresh
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`helius ${res.status}`);
  return res.json();
}

/**
 * Returns list of unique mint addresses created by the given programs within last `hours`.
 * We detect SPL token mints by scanning instructions for InitializeMint / CreateMint patterns.
 */
export async function getRecentMintsByPrograms(
  programIds: string[],
  heliusKey: string,
  hours = 24,
  maxPerProgram = 300
): Promise<{ mint: string; ts: number }[]> {
  const since = Math.floor(Date.now() / 1000) - hours * 3600;
  const mintSet = new Map<string, number>();

  // Helius Enhanced getTransactions for each program (paginated-light; stop once ts < since)
  for (const program of programIds) {
    let before: string | null = null;
    let fetched = 0;
    while (fetched < maxPerProgram) {
      const body = {
        jsonrpc: "2.0",
        id: "bags",
        method: "getSignaturesForAddress",
        params: [
          program,
          { before, limit: 100 },
        ],
      };
      const sigsResp = await fetchJson(`${HELIUS_BASE}/?api-key=${heliusKey}`, body);
      const sigs = sigsResp.result as { signature: string; blockTime?: number }[];
      if (!sigs?.length) break;

      const cutoffIndex = sigs.findIndex(s => (s.blockTime || 0) < since);
      const batch = cutoffIndex >= 0 ? sigs.slice(0, cutoffIndex) : sigs;
      if (!batch.length) break;

      // fetch parsed transactions for batch signatures
      const txBody = {
        jsonrpc: "2.0",
        id: "bags-tx",
        method: "getTransactions",
        params: [ batch.map(s => s.signature), { maxSupportedTransactionVersion: 0 } ],
      };
      const txResp = await fetchJson(`${HELIUS_BASE}/?api-key=${heliusKey}`, txBody);
      const txs = (txResp.result || []) as any[];

      for (const t of txs) {
        const ts = t?.blockTime || 0;
        // parse instructions to find SPL InitializeMint
        const messages = t?.transaction?.message;
        const inner = t?.meta?.innerInstructions || [];
        const allIx = [
          ...(messages?.instructions || []),
          ...inner.flatMap((x: any) => x.instructions || []),
        ];

        let mintAddr: string | null = null;

        // Heuristic 1: Helius parsed events
        const heliusMint = t?.meta?.postTokenBalances?.find((b: any) => b?.owner === null)?.mint;
        if (heliusMint) mintAddr = heliusMint;

        // Heuristic 2: scan for InitializeMint (program spl-token)
        if (!mintAddr) {
          const splIxs = allIx.filter((ix: any) => ix?.programId === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
          for (const ix of splIxs) {
            const name = ix.parsed?.type || ix.parsed?.info?.type || ix.parsed?.instructionName;
            if (name && /initialize.*mint/i.test(String(name))) {
              const candidate = ix.parsed?.info?.mint || ix.parsed?.info?.account || ix.parsed?.mint;
              if (candidate) { mintAddr = candidate; break; }
            }
          }
        }

        if (mintAddr) {
          // keep newest timestamp for that mint
          if (!mintSet.has(mintAddr) || (mintSet.get(mintAddr)! < ts)) mintSet.set(mintAddr, ts);
        }
      }

      fetched += batch.length;
      before = sigs[sigs.length - 1]?.signature;
      if (cutoffIndex >= 0) break;
    }
  }

  return Array.from(mintSet.entries()).map(([mint, ts]) => ({ mint, ts }));
}