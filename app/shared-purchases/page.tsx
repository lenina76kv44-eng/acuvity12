"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import Image from "next/image";

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

export default function SharedPurchasesPage() {
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
  const [pages, setPages] = useState(5);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryNotice, setRetryNotice] = useState("");
  const [progress, setProgress] = useState("");

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
      
      const runAnalysis = async (pageCount: number) => {
        const params = new URLSearchParams({
          addresses: addrs.join(','),
          pages: pageCount.toString(),
          meta: '1'
        });
        
        const res = await fetch(`/api/analyze/shared-purchases?${params}`, { cache: "no-store" });
        const raw = await res.text();
        if (!res.ok) throw new Error(`Analysis failed: ${raw.slice(0,200)}`);
        return JSON.parse(raw);
      };

      let j;
      try {
        j = await runAnalysis(pages);
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (/504|429|timeout/i.test(msg)) {
          // shallow retry
          const reducedPages = Math.max(2, pages - 2);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-3">
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
          <div>
            <label className="block text-xs font-semibold text-[#7AEFB8] mb-2 uppercase tracking-wide">
              Pages to Analyze
            </label>
            <select
              value={pages}
              onChange={(e) => setPages(Number(e.target.value))}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-green-100 outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <option key={n} value={n}>{n} page{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
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
                Analyzed {results.input.addresses.length} wallets × {results.input.pages} pages
              </div>
            </div>

            {results.list.length > 0 ? (
              <div className="space-y-2">
                {results.list.map((token: any, i: number) => (
                  <div key={i} className="rounded-xl border border-neutral-800 bg-black/50 p-4 find-hover">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {token.meta?.image ? (
                          <Image
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
                  No shared tokens found. Try lowering pages or re-run later — the RPC may be rate-limited.
                </div>
              </div>
            )}
          </div>
        )}

        {!error && !results && !loading && (
          <div className="text-green-300/60 mt-4 text-xs">
            Enter 2–10 Solana addresses and press Find to discover shared token purchases.
          </div>
        )}
      </div>
    </div>
  );
}