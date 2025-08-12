"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { getBoughtTokenMints, intersectMany, type EnhancedTx } from "@/src/lib/solana";
import { batchResolveMetas, preloadJupiterList, fallbackAvatar, type TokenMeta } from "@/src/lib/tokenMeta";

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

function sleep(ms: number) { 
  return new Promise(r => setTimeout(r, ms)); 
}

async function fetchHeliusPage(address: string, before: string | undefined, limit: number) {
  const u = new URL(`/api/helius-proxy`, window.location.origin);
  u.searchParams.set("address", address);
  u.searchParams.set("limit", String(limit));
  if (before) u.searchParams.set("before", before);

  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const r = await fetch(u.toString(), { method: "GET", headers: { "accept": "application/json" } });
      const raw = await r.text();
      if (!r.ok) {
        // retry on 429/5xx
        if ((r.status === 429 || r.status === 502 || r.status === 503 || r.status === 504) && attempt <= 3) {
          await sleep(350 * attempt * attempt);
          continue;
        }
        throw new Error(`${r.status}: ${raw.slice(0, 180)}`);
      }
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr as EnhancedTx[];
    } catch (e: any) {
      const transient = /timeout|network|fetch|socket|abort/i.test(String(e?.message || e));
      if (transient && attempt <= 3) { 
        await sleep(350 * attempt * attempt); 
        continue; 
      }
      throw e;
    }
  }
}

export default function BubbleMapPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 find-green-gradient">Shared Tokens Finder</h1>
          <p className="text-[#888888] text-base">
            Find tokens purchased by multiple wallets. Analyze 2–10 addresses to discover shared investments.
          </p>
        </header>

        <div className="max-w-4xl">
          <SharedTokensCard />
        </div>
      </div>
    </main>
  );
}

function SharedTokensCard() {
  const [addresses, setAddresses] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryNotice, setRetryNotice] = useState("");
  const [progress, setProgress] = useState("");

  // Fixed values - hidden from user
  const pages = 10;
  const limit = 100;

  async function analyzeSharedTokens() {
    setLoading(true); 
    setError(""); 
    setResults(null);
    setProgress("");
    setRetryNotice("");

    const clean = addresses.trim();
    if (!clean) {
      setError("Please enter 2–10 Solana addresses");
      setLoading(false);
      return;
    }

    const addrs = clean.split(/[\s,\n]+/).map(s => s.trim()).filter(Boolean);
    if (addrs.length < 2 || addrs.length > 10) {
      setError("Please provide between 2–10 addresses");
      setLoading(false);
      return;
    }

    try {
      setProgress(`Analyzing ${addrs.length} wallets...`);
      
      const runAnalysis = async (pageCount: number = 10) => {
        // Preload Jupiter token list
        await preloadJupiterList().catch(() => {});

        const per: Array<{ address: string; bought: Set<string> }> = [];

        for (let i = 0; i < addrs.length; i++) {
          const addr = addrs[i];
          setProgress(`Analyzing wallet ${i + 1}/${addrs.length}…`);
          const txs: EnhancedTx[] = [];
          let before: string | undefined;
          let lim = limit;

          for (let p = 0; p < pageCount; p++) {
            try {
              const arr = await fetchHeliusPage(addr, before, lim);
              if (!arr.length) break;
              txs.push(...arr);
              before = arr[arr.length - 1]?.signature;
              if (!before) break;
              await sleep(120);
            } catch (e: any) {
              const msg = String(e?.message || e);
              if (/^(429|502|503|504)/.test(msg) || /timeout|network|abort/i.test(msg)) {
                lim = Math.max(40, Math.floor(lim * 0.7));
                await sleep(400);
                p--; // retry same page lighter
                continue;
              }
              console.warn(`Wallet ${addr} page error:`, msg);
              break;
            }
          }

          // Build purchased set
          const bought = new Set<string>();
          for (const tx of txs) {
            try {
              getBoughtTokenMints(tx, addr).forEach(m => bought.add(m));
            } catch {}
          }
          per.push({ address: addr, bought });
        }

        setProgress("Finding shared tokens…");
        // count by mint across wallets
        const bag: Record<string, string[]> = {};
        per.forEach(({ address, bought }) => {
          bought.forEach(m => {
            (bag[m] ??= []).push(address);
          });
        });
        const shared = Object.entries(bag)
          .filter(([, owners]) => owners.length >= 2) // ключевая правка
          .map(([mint, owners]) => ({ mint, wallets: owners, count: owners.length }))
          .sort((a,b) => b.count - a.count || a.mint.localeCompare(b.mint));

        if (!shared.length) {
          return {
            ok: true,
            input: { addresses: addrs, pages: pageCount },
            found: 0,
            list: []
          };
        }

        setProgress("Loading token metadata…");
        const metas = await batchResolveMetas(shared.map(x => x.mint));

        const list = shared.map(row => {
          const meta = metas[row.mint] || null;
          return {
            mint: row.mint,
            count: row.count,
            wallets: row.wallets,
            meta: meta ? {
              name: meta.name,
              symbol: meta.symbol,
              image: meta.logoURI
            } : null
          };
        });

        return {
          ok: true,
          input: { addresses: addrs, pages: pageCount },
          found: list.length,
          list
        };
      };

      let j;
      try {
        j = await runAnalysis(10);
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (/504|429|timeout/i.test(msg)) {
          // shallow retry
          const reducedPages = 6;
          setRetryNotice(`Timed out — re-running with a lighter scan (${reducedPages} pages)...`);
          setProgress(`Retrying with ${reducedPages} pages...`);
          j = await runAnalysis(reducedPages);
          setRetryNotice("");
        } else {
          throw e;
        }
      }
      
      setResults(j);
      setProgress("");
    } catch (e: any) {
      console.error("Shared tokens analysis error:", e);
      setError("Find failed. Try again.");
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && addresses.trim() && !loading) {
      analyzeSharedTokens();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow find-hover">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold">Multi-Wallet Analysis</div>
        <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">Find Shared Token Purchases</h2>
        <p className="text-[#8A8A8A] text-sm leading-relaxed">
          Discover tokens that multiple wallets have purchased. Perfect for finding trending investments.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#7AEFB8] mb-2 uppercase tracking-wide">
            Solana Addresses (2–10)
          </label>
          <textarea
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Da63jxs..., 94bGHZ5e...&#10;(comma or newline separated)"
            rows={3}
            className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-green-100 placeholder:text-green-300/50 outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={analyzeSharedTokens}
            disabled={loading || !addresses.trim()}
            className="rounded-xl bg-green-600 text-black px-6 py-3 font-semibold hover:bg-green-500 active:bg-green-600 disabled:opacity-50 shadow-[0_0_0_1px_rgba(0,255,136,.2)] hover:shadow-[0_10px_30px_rgba(0,255,136,.15)] transition-all duration-200"
          >
            {loading ? "Finding…" : "Find"}
          </button>
          {progress && (
            <div className="flex items-center text-green-300/80 text-sm">
              <div className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full mr-2"></div>
              {progress}
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-400 mt-3">{error}</div>
        )}
        
        {retryNotice && (
          <div className="text-yellow-400 mt-3 text-sm bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            {retryNotice}
          </div>
        )}

        {results && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#7AEFB8] uppercase tracking-wide">
                Shared Tokens Found: {results.found}
              </div>
              <div className="text-xs text-neutral-400">
                Analyzed {results.input.addresses.length} wallets (deep scan)
              </div>
            </div>

            {results.list.length > 0 ? (
              <div className="space-y-2">
                {results.list.map((token: any, i: number) => (
                  <div key={i} className="rounded-xl border border-neutral-800 bg-black/50 p-4 find-hover">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {token.meta?.image ? (
                          <img
                            src={token.meta.image}
                            alt={token.meta.name || token.mint}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg border border-neutral-700 object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg border border-neutral-700 bg-neutral-800 flex items-center justify-center">
                            <svg className="w-6 h-6 text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8-2a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-green-100 mb-1">
                          {token.meta?.name || `${token.mint.slice(0,4)}…${token.mint.slice(-4)}`}
                        </div>
                        <div className="text-xs text-neutral-400 mb-2">
                          {token.meta?.symbol || "—"} • {token.count} wallet{token.count > 1 ? 's' : ''}
                        </div>
                        <div className="font-mono text-xs text-neutral-500 break-all">
                          {token.mint}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(token.mint)}
                          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-green-200 text-xs font-medium rounded-lg transition-colors"
                        >
                          Copy CA
                        </button>
                        <a
                          href={`https://solscan.io/token/${token.mint}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-green-600 hover:bg-green-500 text-black text-xs font-medium rounded-lg transition-colors"
                        >
                          Solscan
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-neutral-400 text-sm">
                  No shared tokens found. Try increasing pages to 8–10 or re-run later — the RPC may be rate-limited.
                </div>
              </div>
            )}
          </div>
        )}

        {!error && !results && !loading && (
          <div className="text-green-300/60 mt-4 text-xs">
            Enter 2–10 Solana addresses to discover tokens that were purchased by multiple wallets. Analyzes transaction history to find shared investments, even if tokens were later sold.
          </div>
        )}
      </div>
    </div>
  );
}