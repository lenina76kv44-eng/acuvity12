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
      {/* CA Finder specific background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-32 right-16 w-28 h-28 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 left-24 w-36 h-36 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-1500"></div>
        <div className="absolute bottom-40 right-1/3 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl animate-pulse delay-3000"></div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
              CA Finder Search
            </h1>
          </div>
          <p className="text-[#888888] text-base">
            Find creators and fee splits by contract address
          </p>
        </header>

        <div className="max-w-2xl">
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-pink-950/20 backdrop-blur-sm p-6 hover:border-purple-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <CaToCreatorsCard />
          </div>
        </div>
      </div>
    </main>
  );
}

function CaToCreatorsCard() {
  const [ca, setCa] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchCreators() {
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
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && ca.trim() && !loading) {
      fetchCreators();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-purple-400 mb-1 font-semibold flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          Contract Address
        </div>
        <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">CA Finder — Find Creators</h2>
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
            className="flex-1 rounded-xl bg-purple-950/30 border border-purple-500/30 px-4 py-3 text-purple-100 placeholder:text-purple-300/50 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-200"
          />
          <button
            onClick={fetchCreators}
            disabled={loading || !ca.trim()}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-3 font-semibold hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
          >
            {loading ? "Finding…" : "Find"}
          </button>
        </div>

        {error && (
          <div className="text-red-400 mt-3">{error}</div>
        )}

        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-purple-400 mb-3 uppercase tracking-wide">
              Creators Found: {rows.length}
            </div>
            {rows.map((c, i) => (
              <div key={i} className="rounded-xl border border-neutral-800 bg-black/50 p-4">
                <div className="flex items-center gap-4 mb-4">
                  {c.pfp ? (
                    <img 
                      src={c.pfp} 
                      alt={c.username || "User"} 
                      className="w-10 h-10 rounded-lg object-cover border border-neutral-700" 
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
                    <div className="text-xs text-purple-400 font-semibold mb-1 uppercase tracking-wide">Wallet</div>
                    <div className="font-mono text-xs break-all bg-black/50 border border-neutral-800 rounded-xl p-3 text-green-200">
                      {c.wallet || "—"}
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-purple-400 font-semibold mb-1 uppercase tracking-wide">Royalty</div>
                    <div className="bg-black/50 border border-neutral-800 rounded-xl p-3 text-green-200 font-mono text-sm">
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