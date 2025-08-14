"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

export default function TwitterSearchPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0d1a0f] to-[#0a0a0a] animate-morphing-bg opacity-70"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,255,136,0.08)_0%,transparent_50%)] animate-zoom-pulse"></div>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-12 relative z-10">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#0e2018] text-[#74f3bf] border border-[#143626] animate-glow-border mb-4">
            Real-time Search
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 animate-gradient-shift bg-gradient-to-r from-[#00ff88] to-[#00cc6a] bg-clip-text text-transparent">
            X Search Tools
          </h1>
          <p className="text-[#888888] text-lg leading-relaxed animate-fade-in stagger-1">
            Search by X handle to find wallets, or search by wallet to find X tags
          </p>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-[#00ff88]/10 to-[#00cc6a]/5 border border-[#00ff88]/20 animate-slide-in-up stagger-2">
              <div className="w-8 h-8 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
                <span className="text-[#00ff88] text-sm">🔍</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Fast Search</div>
                <div className="text-xs text-[#888888]">Instant results</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-[#00ff88]/10 to-[#00cc6a]/5 border border-[#00ff88]/20 animate-slide-in-up stagger-3">
              <div className="w-8 h-8 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
                <span className="text-[#00ff88] text-sm">🔗</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">BAGS Tokens</div>
                <div className="text-xs text-[#888888]">Creator insights</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-[#00ff88]/10 to-[#00cc6a]/5 border border-[#00ff88]/20 animate-slide-in-up stagger-4">
              <div className="w-8 h-8 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
                <span className="text-[#00ff88] text-sm">⚡</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Real-time Data</div>
                <div className="text-xs text-[#888888]">Live on-chain</div>
              </div>
            </div>
          </div>
        </header>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow card-hover tool-section animate-slide-in-up">
          <XToWalletCard />
          <WalletToXCard />
        </div>
        
        {/* How it works section */}
        <section className="mt-16 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 animate-fade-in">How X Search Works</h2>
            <p className="text-[#888888] animate-fade-in stagger-1">
              Our advanced search connects X profiles to Solana wallets through the BAGS ecosystem
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="feature-highlight p-6 rounded-xl text-center animate-slide-in-up stagger-2">
              <div className="w-12 h-12 rounded-full bg-[#00ff88]/20 flex items-center justify-center mx-auto mb-4 animate-zoom-pulse">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Enter X Handle</h3>
              <p className="text-sm text-[#888888]">Start with any X (Twitter) username to begin the search</p>
            </div>
            
            <div className="feature-highlight p-6 rounded-xl text-center animate-slide-in-up stagger-3">
              <div className="w-12 h-12 rounded-full bg-[#00ff88]/20 flex items-center justify-center mx-auto mb-4 animate-zoom-pulse">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">BAGS Database</h3>
              <p className="text-sm text-[#888888]">Query the BAGS creator ecosystem for wallet mappings</p>
            </div>
            
            <div className="feature-highlight p-6 rounded-xl text-center animate-slide-in-up stagger-4">
              <div className="w-12 h-12 rounded-full bg-[#00ff88]/20 flex items-center justify-center mx-auto mb-4 animate-zoom-pulse">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Get Results</h3>
              <p className="text-sm text-[#888888]">Receive wallet address, balance, and token holdings</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function XToWalletCard() {
  const [devTag, setDevTag] = useState("");
  const [wallet, setWallet] = useState<string | null>(null);
  const [sol, setSol] = useState<number | null>(null);
  const [hCoins, setHCoins] = useState<any[]>([]);
  const [hLoading, setHLoading] = useState(false);
  const [hError, setHError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  async function enrichWithMeta(rows: any[]) {
    const mints = Array.from(new Set(rows.map(r => r.mint).filter(Boolean)));
    if (!mints.length) return rows;

    const res = await fetch("/api/token-meta", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mints }),
    });
    const j = await res.json();
    const map = j?.data || {};
    return rows.map(r => ({ ...r, meta: map[r.mint] || null }));
  }

  async function fetchJson(url: string) {
    const res = await fetch(url);
    const raw = await res.text();
    const p = parseJsonSafe(raw);
    if (!p.ok) throw new Error(p.error);
    return p.data;
  }

  async function loadWalletOverview(addr: string) {
    const j = await fetchJson(`/api/wallet-overview?address=${encodeURIComponent(addr)}`);
    if (!j.ok) throw new Error(j.error || "Overview failed");
    setSol(typeof j.solBalance === "number" ? j.solBalance : null);
  }

  async function loadHeliusCoins(addr: string) {
    try {
      setHLoading(true); setHError(""); setHCoins([]);
      const res = await fetch(`/api/wallet-coins-helius?wallet=${encodeURIComponent(addr)}&suffix=BAGS`);
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || "Helius scan failed");
      
      const EXCLUDE = new Set([
        "So11111111111111111111111111111111111111112",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      ]);
      
      const cleaned = (Array.isArray(j.data) ? j.data : [])
        .filter((r: any) => r.role !== "program-match")
        .filter((r: any) => !EXCLUDE.has(r.mint));
      
      const enriched = await enrichWithMeta(cleaned);
      setHCoins(enriched);
    } catch (e: any) {
      setHError(e.message || String(e));
    } finally {
      setHLoading(false);
    }
  }

  async function findWallet() {
    setIsAnimating(true);
    setLoading(true); setError("");
    setWallet(null); setSol(null); setHCoins([]);
    setHError("");

    const clean = devTag.trim().replace(/^@/, "").toLowerCase();
    try {
      const j = await fetchJson(`/api/twitter-wallet?handle=${encodeURIComponent(clean)}`);
      if (!j.ok) throw new Error(j.error || "Request failed");
      const addr = j.wallet || null;
      setWallet(addr);
      if (!addr) { setError("Nothing to find for this dev tag."); return; }

      await Promise.all([
        loadWalletOverview(addr),
        loadHeliusCoins(addr),
      ]);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && devTag.trim() && !loading) {
      findWallet();
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow card-hover card-tilt tool-section animate-slide-in-up">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold animate-fade-in">X → Wallet</div>
        <h2 className="text-xl font-semibold text-white mb-2 tracking-tight animate-typewriter">X Dev Tag Search</h2>
        <p className="text-[#8A8A8A] text-sm leading-relaxed animate-fade-in stagger-1">
          Enter an X dev tag to find the wallet and discover BAGS tokens
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3 animate-slide-in-up stagger-2">
          <input
            value={devTag}
            onChange={(e) => setDevTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="@dev_on_x"
            className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-green-100 placeholder:text-green-300/50 outline-none focus:ring-2 focus:ring-green-600 input-animated hover:border-[#00ff88]/40 transition-all duration-300"
          />
          <button
            onClick={findWallet}
            disabled={loading || !devTag.trim()}
            className={`rounded-xl bg-green-600 text-black px-5 py-3 font-semibold hover:bg-green-500 active:bg-green-600 disabled:opacity-50 shadow-[0_0_0_1px_rgba(0,255,136,.2)] hover:shadow-[0_10px_30px_rgba(0,255,136,.15)] btn-animated btn-glow ${loading ? 'animate-pulse-glow-enhanced' : ''}`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="loading-spinner-enhanced"></div>
                <span>Finding<span className="animate-loading-dots"></span></span>
              </div>
            ) : "Find"}
          </button>
        </div>

        {error && (
          <div className="text-red-400 mt-3 animate-bounce-in">{error}</div>
        )}

        {wallet && (
          <div className="mt-4 space-y-4 animate-slide-in-up results-container">
            <div className="success-state rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-[#7AEFB8] font-semibold animate-fade-in">Mapped Wallet</div>
              <div className="mt-1 flex items-center gap-3 bg-black/50 border border-neutral-800 rounded-xl p-3 hover-glow">
                <div className="font-mono break-all text-green-100 wallet-display flex-1">
                  {wallet}
                </div>
                <a
                  href={`https://solscan.io/account/${wallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-[#00ff88] hover:bg-[#00cc6a] text-black text-xs font-semibold rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-1 whitespace-nowrap"
                  title="View on Solscan"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7Z"/>
                  </svg>
                  Solscan
                </a>
              </div>
            </div>

            <div className="animate-slide-in-up stagger-1">
              <div className="text-xs uppercase tracking-wide text-[#7AEFB8] font-semibold flex items-center gap-2 animate-fade-in">
                Balance
                <img
                  src="https://i.imgur.com/X5Fsrnb.png" 
                  alt="SOL" 
                  className="w-4 h-4 animate-zoom-pulse"
                />
              </div>
              <div className="mt-1 font-mono bg-black/50 border border-neutral-800 rounded-xl p-3 inline-block text-sm hover-glow">
                {sol != null ? `${sol} SOL` : "—"}
              </div>
            </div>

            <div className="animate-slide-in-up stagger-2">
              <div className="text-xs uppercase tracking-wide text-[#7AEFB8] font-semibold mb-2 animate-fade-in">
                Coins — Found on-chain
              </div>

              {hLoading && <div className="text-green-300/60 text-xs flex items-center gap-2 animate-fade-in">
                <div className="loading-spinner-enhanced"></div>
                <span>Finding<span className="animate-loading-dots"></span></span>
              </div>}
              {hError && <div className="text-red-400 text-xs animate-shake">Find failed. Try again.</div>}

              {!hLoading && !hError && (
                hCoins.length ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <div className="text-xs text-green-300/60 mb-2 animate-fade-in">
                      Find results: {hCoins.length} BAGS tokens
                    </div>
                    {hCoins.slice(0, 15).map((c, i) => (
                      <div key={i} className="rounded-xl border border-neutral-800 bg-black/50 p-3 hover-glow card-tilt interactive-hover animate-scale-in" style={{animationDelay: `${i * 0.1}s`}}>
                        <div className="flex items-center gap-3 mb-3">
                          {c?.meta?.image ? (
                            <img
                              src={c.meta.image}
                              alt={c.meta.name || c.mint}
                              className="w-8 h-8 rounded-lg border border-neutral-700 object-cover flex-shrink-0 interactive-hover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg border border-neutral-700 bg-neutral-800 flex-shrink-0" />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-green-100">
                              {c?.meta?.name || `${c.mint.slice(0,4)}…${c.mint.slice(-4)}`}
                            </div>
                            <div className="text-xs text-neutral-400">
                              {c?.meta?.symbol || "—"}
                            </div>
                          </div>
                          
                          <span className={
                            "px-2 py-1 rounded-full border font-medium text-xs flex-shrink-0 " +
                            (c.role === "launch"
                              ? "bg-green-500/10 border-green-500/30 text-green-400"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-300")
                          }>
                            {c.role === "launch" ? "Find: Launch" : "Find: Fee-claim"}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs text-neutral-400 mb-1">
                            {c.time ? new Date(c.time * 1000).toLocaleDateString() : ""}
                          </div>
                          <a
                            href={`https://bags.fm/${c.mint}`}
                            target="_blank" rel="noopener noreferrer"
                            className="block font-mono text-xs underline decoration-green-600/40 hover:decoration-green-400 break-all text-green-200"
                          >
                            {c.mint}
                          </a>
                          <div className="text-xs text-neutral-500">
                            tx: <a
                              href={`https://solscan.io/tx/${c.tx}`}
                              target="_blank" rel="noopener noreferrer"
                              className="underline decoration-neutral-600 hover:decoration-neutral-400"
                            >
                              {c.tx.slice(0, 8)}…{c.tx.slice(-8)}
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                    {hCoins.length > 15 && (
                      <div className="text-xs text-green-300/60 text-center py-2">
                        Showing first 15 of {hCoins.length} tokens
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-green-300/60 text-xs">Nothing to find yet.</div>
                )
              )}
            </div>
          </div>
        )}

        {!error && !wallet && !loading && (
         <div className="text-green-300/60 mt-4 text-xs">Type an X dev tag and press Find.</div>
        )}
      </div>
    </div>
  );
}

function WalletToXCard() {
  const [wallet, setWallet] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  function isValidBase58Wallet(address: string): boolean {
    if (!address || address.length < 32 || address.length > 48) return false;
    return /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
  }

  async function findXTags() {
    setIsAnimating(true);
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
      setTimeout(() => setIsAnimating(false), 300);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && wallet.trim() && !loading) {
      findXTags();
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow card-hover tool-section animate-slide-in-up stagger-2">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold animate-fade-in">Wallet → X</div>
        <h2 className="text-xl font-semibold text-white mb-2 tracking-tight animate-typewriter">Wallet → X tags</h2>
        <p className="text-[#8A8A8A] text-sm leading-relaxed animate-fade-in stagger-1">
          Find X tags associated with a wallet through Bags creator data
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3 animate-slide-in-up stagger-2">
          <input
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste wallet address"
            className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-green-100 placeholder:text-green-300/50 outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 input-animated hover:border-[#00ff88]/40 transition-all duration-300"
          />
          <button
            onClick={findXTags}
            disabled={loading || !wallet.trim()}
            className={`rounded-xl bg-green-600 text-black px-5 py-3 font-semibold hover:bg-green-500 active:bg-green-600 disabled:opacity-50 shadow-[0_0_0_1px_rgba(0,255,136,.2)] hover:shadow-[0_10px_30px_rgba(0,255,136,.15)] btn-animated btn-glow ${loading ? 'animate-pulse-glow-enhanced' : ''}`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="loading-spinner-enhanced"></div>
                <span>Finding<span className="animate-loading-dots"></span></span>
              </div>
            ) : "Find"}
          </button>
        </div>

        {/* Validation Error */}
        {wallet.trim() && !isValidBase58Wallet(wallet.trim()) && (
          <div className="text-red-400/70 text-xs animate-bounce-in animate-shake">
            Invalid wallet address format (must be 32-48 characters, base58)
          </div>
        )}

        {error && (
          <div className="text-red-400 mt-3 animate-bounce-in animate-shake">{error}</div>
        )}

        {results && (
          <div className="mt-6 space-y-4 animate-slide-in-up">
            {/* X Tags Pills */}
            {results.twitters && results.twitters.length > 0 ? (
              <div className="success-state rounded-xl p-4">
                <div className="text-xs uppercase tracking-wide text-[#7AEFB8] font-semibold mb-3 animate-fade-in">
                  Found X Tags ({results.twitters.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.twitters.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium animate-bounce-in hover-glow interactive-hover"
                      style={{animationDelay: `${i * 0.1}s`}}
                    >
                      @{tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 animate-fade-in">
                <div className="text-[#666666] text-sm">
                  No X tags matched this wallet (via Bags creators)
                </div>
              </div>
            )}

            {/* Creator Details */}
            {results.creators && results.creators.length > 0 && (
              <div className="animate-slide-in-up stagger-1">
                <div className="text-xs uppercase tracking-wide text-[#7AEFB8] font-semibold mb-3 animate-fade-in">
                  Creator Details ({results.creators.length})
                </div>
                <div className="space-y-3">
                  {results.creators.map((creator: any, i: number) => (
                    <div key={i} className="rounded-xl border border-neutral-800 bg-black/50 p-4 hover-glow card-tilt interactive-hover animate-scale-in" style={{animationDelay: `${i * 0.1}s`}}>
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
              <div className="text-xs text-neutral-500 pt-4 border-t border-neutral-800 animate-fade-in stagger-3">
                Scanned {results.scanned.pages} pages × {results.scanned.limitPerPage} txs, 
                checked {results.scanned.mintsChecked} BAGS tokens
              </div>
            )}
          </div>
        )}

        {!error && !results && !loading && (
          <div className="text-green-300/60 mt-4 text-xs animate-fade-in">
            Enter a wallet address to find associated X tags through Bags creator data.
          </div>
        )}
      </div>
    </div>
  );
}