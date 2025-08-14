"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

export default function TokenCreatorsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f1a14] to-[#0a0a0a] animate-morphing-bg opacity-70"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,255,136,0.06)_0%,transparent_50%)] animate-zoom-pulse"></div>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-12 relative z-10">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#0e2018] text-[#74f3bf] border border-[#143626] animate-glow-border mb-4">
            Creator Discovery
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 animate-gradient-shift bg-gradient-to-r from-[#00ff88] to-[#00cc6a] bg-clip-text text-transparent">
            CA Finder Search
          </h1>
          <p className="text-[#888888] text-lg leading-relaxed animate-fade-in stagger-1">
            Find creators and fee splits by contract address
          </p>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-[#00ff88]/10 to-[#00cc6a]/5 border border-[#00ff88]/20 animate-slide-in-up stagger-2">
              <div className="w-8 h-8 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
                <span className="text-[#00ff88] text-sm">👥</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Creator Info</div>
                <div className="text-xs text-[#888888]">Full creator details</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-[#00ff88]/10 to-[#00cc6a]/5 border border-[#00ff88]/20 animate-slide-in-up stagger-3">
              <div className="w-8 h-8 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
                <span className="text-[#00ff88] text-sm">💰</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Fee Splits</div>
                <div className="text-xs text-[#888888]">Royalty breakdown</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-[#00ff88]/10 to-[#00cc6a]/5 border border-[#00ff88]/20 animate-slide-in-up stagger-4">
              <div className="w-8 h-8 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
                <span className="text-[#00ff88] text-sm">🔗</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Social Links</div>
                <div className="text-xs text-[#888888]">X profiles & more</div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-2xl relative z-10">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow card-hover card-tilt tool-section">
            <CaToCreatorsCard />
          </div>
        </div>
        
        {/* How it works section */}
        <section className="mt-16 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 animate-fade-in">How CA Finder Works</h2>
            <p className="text-[#888888] animate-fade-in stagger-1">
              Discover the people behind any token by analyzing contract addresses and creator data
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="feature-highlight p-6 rounded-xl text-center animate-slide-in-up stagger-2">
              <div className="w-12 h-12 rounded-full bg-[#00ff88]/20 flex items-center justify-center mx-auto mb-4 animate-zoom-pulse">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Enter Contract Address</h3>
              <p className="text-sm text-[#888888]">Paste any Solana token contract address (CA) to start</p>
            </div>
            
            <div className="feature-highlight p-6 rounded-xl text-center animate-slide-in-up stagger-3">
              <div className="w-12 h-12 rounded-full bg-[#00ff88]/20 flex items-center justify-center mx-auto mb-4 animate-zoom-pulse">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Creator Lookup</h3>
              <p className="text-sm text-[#888888]">Search through BAGS creator database for matches</p>
            </div>
            
            <div className="feature-highlight p-6 rounded-xl text-center animate-slide-in-up stagger-4">
              <div className="w-12 h-12 rounded-full bg-[#00ff88]/20 flex items-center justify-center mx-auto mb-4 animate-zoom-pulse">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Get Creator Details</h3>
              <p className="text-sm text-[#888888]">View creators, X handles, wallets, and royalty splits</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function CaToCreatorsCard() {
  const [ca, setCa] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  async function fetchCreators() {
    setIsAnimating(true);
    setLoading(true); setError(""); setRows([]);
    const clean = ca.trim();
    
    if (!clean) {
      setError("Please enter a contract address");
      setLoading(false);
      return;
    }
    
    if (clean.length < 32 || clean.length > 44) {
      setError("Invalid CA format");
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/token-creators?ca=${encodeURIComponent(clean)}`);
      const raw = await res.text();
      const p = parseJsonSafe(raw);
      if (!p.ok) throw new Error(p.error);
      const j = p.data;
      if (!j.ok) throw new Error(j.error || "Request failed");
      
      const creators = (Array.isArray(j.data) ? j.data : []).map((c: any) => ({
        username: c?.username ?? null,
        twitter: c?.twitterUsername ?? null,
        wallet: c?.wallet ?? null,
        royaltyPct: typeof c?.royaltyBps === "number" ? c.royaltyBps / 100 : null,
        isCreator: !!c?.isCreator,
        pfp: c?.pfp ?? null,
      }));
      
      setRows(creators);
      if (!creators.length) setError("No creators found for this CA.");
    } catch (e: any) {
      console.error("Fetch creators error:", e);
      setError("Find failed. Please check the contract address and try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && ca.trim() && !loading) {
      fetchCreators();
    }
  };

  return (
    <div className="animate-slide-in-up tool-section">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold animate-fade-in">Contract Address</div>
        <h2 className="text-xl font-semibold text-white mb-2 tracking-tight animate-typewriter">CA Finder — Find Creators</h2>
        <p className="text-[#8A8A8A] text-sm leading-relaxed animate-fade-in stagger-1">
          Find creators and fee splits by contract address.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3 animate-slide-in-up stagger-2">
          <input
            value={ca}
            onChange={(e) => setCa(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Contract address"
            className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-green-100 placeholder:text-green-300/50 outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 input-animated hover:border-[#00ff88]/40 transition-all duration-300"
          />
          <button
            onClick={fetchCreators}
            disabled={loading || !ca.trim()}
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
          <div className="text-red-400 mt-3 animate-bounce-in animate-shake">{error}</div>
        )}

        {rows.length > 0 && (
          <div className="space-y-3 animate-slide-in-up">
            <div className="text-xs font-semibold text-[#7AEFB8] mb-3 uppercase tracking-wide animate-fade-in success-state rounded-lg p-2 text-center">
              Creators Found: {rows.length}
            </div>
            {rows.map((c, i) => (
              <div key={i} className="rounded-xl border border-neutral-800 bg-black/50 p-4 hover-glow card-tilt interactive-hover animate-scale-in" style={{animationDelay: `${i * 0.1}s`}}>
                <div className="flex items-center gap-4 mb-4">
                  {c.pfp ? (
                    <img 
                      src={c.pfp} 
                      alt={c.username || "User"} 
                      className="w-10 h-10 rounded-lg object-cover border border-neutral-700 interactive-hover" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#666666]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm text-green-100">
                      {c.username || "Unknown User"}
                    </div>
                    {c.twitter && (
                      <div className="text-xs text-neutral-400">@{c.twitter}</div>
                    )}
                  </div>
                  <span className={
                    "px-2 py-1 rounded-full border font-medium text-xs flex-shrink-0 " +
                    (c.isCreator
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-300")
                  }>
                    {c.isCreator ? "Creator" : "Fee Share"}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div>
                    <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide animate-fade-in">Wallet</div>
                    <div className="font-mono text-xs break-all bg-black/50 border border-neutral-800 rounded-xl p-3 text-green-200 hover-glow">
                      {c.wallet || "—"}
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide animate-fade-in stagger-1">Royalty</div>
                    <div className="bg-black/50 border border-neutral-800 rounded-xl p-3 text-green-200 font-mono text-sm hover-glow">
                      {c.royaltyPct != null ? `${c.royaltyPct}%` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && !rows.length && !loading && (
          <div className="text-green-300/60 mt-4 text-xs animate-fade-in">Paste a CA and press Find.</div>
        )}
      </div>
    </div>
  );
}