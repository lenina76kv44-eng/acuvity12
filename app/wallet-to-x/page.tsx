"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

export default function WalletToXPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 find-green-gradient">Wallet → X tags</h1>
          <p className="text-[#888888] text-base">
            Find X (Twitter) tags associated with a wallet through Bags creator data
          </p>
        </header>

        <div className="max-w-2xl">
          <WalletToXCard />
        </div>
      </div>
    </main>
  );
}

function WalletToXCard() {
  const [wallet, setWallet] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function isValidBase58Wallet(address: string): boolean {
    if (!address || address.length < 32 || address.length > 48) return false;
    return /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
  }

  async function findXTags() {
    setLoading(true); 
    setError(""); 
    setResults(null);

    const clean = wallet.trim();
    if (!clean) {
      setError("Please enter a wallet address");
      setLoading(false);
      return;
    }

    if (!isValidBase58Wallet(clean)) {
      setError("Invalid wallet address format");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/wallet-twitter?wallet=${encodeURIComponent(clean)}&pages=5&limit=100`);
      const raw = await res.text();
      const p = parseJsonSafe(raw);
      if (!p.ok) throw new Error(p.error);
      const j = p.data;
      if (!j.ok) throw new Error(j.error || "Request failed");
      
      setResults(j);
    } catch (e: any) {
      console.error("Wallet to X tags error:", e);
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && wallet.trim() && !loading) {
      findXTags();
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow find-hover">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold">Reverse Lookup</div>
        <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">Wallet → X tags</h2>
        <p className="text-[#8A8A8A] text-sm leading-relaxed">
          Finds X tags only if this wallet appears as a creator/fee-claimer on Bags (via on-chain + Bags API).
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <input
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste wallet address"
            className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-green-100 placeholder:text-green-300/50 outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
          />
          <button
            onClick={findXTags}
            disabled={loading || !wallet.trim()}
            className="rounded-xl bg-green-600 text-black px-5 py-3 font-semibold hover:bg-green-500 active:bg-green-600 disabled:opacity-50 shadow-[0_0_0_1px_rgba(0,255,136,.2)] hover:shadow-[0_10px_30px_rgba(0,255,136,.15)] transition-all duration-200"
          >
            {loading ? "Finding…" : "Find"}
          </button>
        </div>

        {/* Validation Error */}
        {wallet.trim() && !isValidBase58Wallet(wallet.trim()) && (
          <div className="text-red-400/70 text-xs">
            Invalid wallet address format (must be 32-48 characters, base58)
          </div>
        )}

        {error && (
          <div className="text-red-400 mt-3">{error}</div>
        )}

        {results && (
          <div className="mt-6 space-y-4">
            {/* X Tags Pills */}
            {results.twitters && results.twitters.length > 0 ? (
              <div>
                <div className="text-xs uppercase tracking-wide text-[#7AEFB8] font-semibold mb-3">
                  Found X Tags ({results.twitters.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.twitters.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium"
                    >
                      @{tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-[#666666] text-sm">
                  No X tags matched this wallet (via Bags creators)
                </div>
              </div>
            )}

            {/* Creator Details */}
            {results.creators && results.creators.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-[#7AEFB8] font-semibold mb-3">
                  Creator Details ({results.creators.length})
                </div>
                <div className="space-y-3">
                  {results.creators.map((creator: any, i: number) => (
                    <div key={i} className="rounded-xl border border-neutral-800 bg-black/50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium text-sm text-green-100">
                              {creator.username || `@${creator.twitter}`}
                            </div>
                            <div className="text-xs text-neutral-400">
                              @{creator.twitter}
                            </div>
                          </div>
                        </div>
                        <span className={
                          "px-2 py-1 rounded-full border font-medium text-xs " +
                          (creator.isCreator
                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-300")
                        }>
                          {creator.isCreator ? "Creator" : "Fee Share"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide">Token</div>
                          <div className="font-mono text-xs break-all bg-black/50 border border-neutral-800 rounded-md p-2 text-green-200">
                            {creator.mint}
                          </div>
                        </div>
                        <div>
                          <div className="text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide">Royalty</div>
                          <div className="bg-black/50 border border-neutral-800 rounded-md p-2 text-green-200 font-mono text-sm">
                            {creator.royaltyPct != null ? `${creator.royaltyPct}%` : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scan Stats */}
            {results.scanned && (
              <div className="text-xs text-neutral-500 pt-4 border-t border-neutral-800">
                Scanned {results.scanned.pages} pages × {results.scanned.limitPerPage} txs, 
                checked {results.scanned.mintsChecked} BAGS tokens
              </div>
            )}
          </div>
        )}

        {!error && !results && !loading && (
          <div className="text-green-300/60 mt-4 text-xs">
            Enter a wallet address to find associated X tags through Bags creator data.
          </div>
        )}
      </div>
    </div>
  );
}