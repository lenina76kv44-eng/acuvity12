"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { Users, Search, Shield, TrendingUp, Zap, Eye } from "lucide-react";

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

export default function TokenCreatorsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-12 text-center animate-slide-in-up">
          <div className="mb-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#00ff88]/20 to-[#00cc6a]/20 border border-[#00ff88]/30 text-[#00ff88] text-sm font-semibold animate-glow-pulse">
              <Users className="w-4 h-4 mr-2" />
              CA Finder
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 find-title-shine animate-text-glow">
            Token Creator Discovery
          </h1>
          <p className="text-[#888888] text-lg max-w-2xl mx-auto leading-relaxed">
            Find creators and fee splits by contract address
          </p>
        </header>

        {/* Features Overview */}
        <section className="mb-12 animate-slide-in-up stagger-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 card-hover enhanced-glow animate-scale-in stagger-1">
              <div className="w-12 h-12 bg-[#00ff88]/10 rounded-xl flex items-center justify-center mb-4 animate-glow-pulse">
                <Search className="w-6 h-6 text-[#00ff88]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Creator Identification</h3>
              <p className="text-gray-400 text-sm">Discover who created any token and their social profiles</p>
            </div>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 card-hover enhanced-glow animate-scale-in stagger-2">
              <div className="w-12 h-12 bg-[#00ff88]/10 rounded-xl flex items-center justify-center mb-4 animate-glow-pulse">
                <TrendingUp className="w-6 h-6 text-[#00ff88]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Fee Structure</h3>
              <p className="text-gray-400 text-sm">Analyze royalty percentages and revenue sharing</p>
            </div>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 card-hover enhanced-glow animate-scale-in stagger-3">
              <div className="w-12 h-12 bg-[#00ff88]/10 rounded-xl flex items-center justify-center mb-4 animate-glow-pulse">
                <Shield className="w-6 h-6 text-[#00ff88]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Verified Data</h3>
              <p className="text-gray-400 text-sm">Authentic creator information from Bags ecosystem</p>
            </div>
          </div>
        </section>
        <div className="max-w-2xl mx-auto animate-slide-in-up stagger-2">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow find-hover hover:scale-105 transition-all duration-300">
            <CaToCreatorsCard />
          </div>
        </div>

        {/* How it Works */}
        <section className="mt-16 animate-slide-in-up stagger-3">
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 card-hover enhanced-glow">
            <h2 className="text-2xl font-bold text-[#00ff88] mb-6 text-center animate-text-glow">Understanding CA Finder</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="animate-scale-in stagger-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-[#00ff88] rounded-full flex items-center justify-center text-black font-bold">1</div>
                  <h3 className="text-lg font-semibold text-white">Contract Analysis</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Enter any Solana token contract address (CA) to analyze its creator structure. 
                  Our system queries the Bags.fm database for comprehensive creator information.
                </p>
              </div>
              <div className="animate-scale-in stagger-2">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-[#00ff88] rounded-full flex items-center justify-center text-black font-bold">2</div>
                  <h3 className="text-lg font-semibold text-white">Creator Insights</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Discover creator profiles, X handles, wallet addresses, and royalty structures. 
                  Understand who benefits from token transactions and how fees are distributed.
                </p>
              </div>
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
    <div className="animate-slide-in-up hover:scale-105 transition-all duration-300">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold animate-glow-pulse">Contract Address</div>
        <h2 className="text-xl font-semibold text-white mb-2 tracking-tight animate-text-glow">CA Finder — Find Creators</h2>
        <p className="text-[#8A8A8A] text-sm leading-relaxed">
          Find creators and fee splits by contract address.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <input
            value={ca}
            onChange={(e) => setCa(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Contract address"
            className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-green-100 placeholder:text-green-300/50 outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 input-animated hover:scale-105 transition-all duration-200"
          />
          <button
            onClick={fetchCreators}
            disabled={loading || !ca.trim()}
            className={`rounded-xl bg-green-600 text-black px-5 py-3 font-semibold hover:bg-green-500 active:bg-green-600 disabled:opacity-50 shadow-[0_0_0_1px_rgba(0,255,136,.2)] hover:shadow-[0_10px_30px_rgba(0,255,136,.15)] btn-animated hover:scale-110 transition-all duration-300 ${loading ? 'animate-pulse-glow' : ''}`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                <span>Finding<span className="animate-loading-dots"></span></span>
              </div>
            ) : "Find"}
          </button>
        </div>

        {error && (
          <div className="text-red-400 mt-3 animate-bounce-in hover-glow">{error}</div>
        )}

        {rows.length > 0 && (
          <div className="space-y-3 animate-slide-in-up">
            <div className="text-xs font-semibold text-[#7AEFB8] mb-3 uppercase tracking-wide animate-glow-pulse">
              Creators Found: {rows.length}
            </div>
            {rows.map((c, i) => (
              <div key={i} className="rounded-xl border border-neutral-800 bg-black/50 p-4 hover-glow animate-scale-in hover:scale-105 transition-all duration-300" style={{animationDelay: `${i * 0.1}s`}}>
                <div className="flex items-center gap-4 mb-4">
                  {c.pfp ? (
                    <img 
                      src={c.pfp} 
                      alt={c.username || "User"} 
                      className="w-10 h-10 rounded-lg object-cover border border-neutral-700 hover:scale-110 transition-all duration-300" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center hover:scale-110 transition-all duration-300">
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
                    <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide animate-glow-pulse">Wallet</div>
                    <div className="font-mono text-xs break-all bg-black/50 border border-neutral-800 rounded-xl p-3 text-green-200 hover-glow">
                      {c.wallet || "—"}
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide animate-glow-pulse">Royalty</div>
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
          <div className="text-green-300/60 mt-4 text-xs">Paste a CA and press Find.</div>
        )}
      </div>
    </div>
  );
}