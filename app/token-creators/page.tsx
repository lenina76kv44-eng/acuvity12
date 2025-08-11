"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

export default function TokenCreatorsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">CA Finder Search</h1>
          <p className="text-[#888888] text-base">
            Find creators and fee splits by contract address
          </p>
        </header>

        <div className="max-w-2xl">
          <CaToCreatorsCard />
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
      setError("Find failed. Try again.");
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
    <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] hover:bg-[#151515] transition-all duration-200 p-6">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            value={ca}
            onChange={(e) => setCa(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Contract address"
            className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-white px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#00ff88] focus:border-[#00ff88] transition-all duration-200 placeholder-[#666666] font-medium"
          />
          <button
            onClick={fetchCreators}
            disabled={loading || !ca.trim()}
            className="rounded-lg bg-[#00ff88] hover:bg-[#00cc6a] text-black px-6 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-w-[80px] text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ...
              </span>
            ) : "Find"}
          </button>
        </div>

        {error && (
          <div className="bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-lg p-3">
            <p className="text-[#ff6666] text-sm font-medium">{error}</p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#888888] mb-3 uppercase tracking-wide">
              Creators Found: {rows.length}
            </div>
            {rows.map((c, i) => (
              <div key={i} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#1f1f1f] transition-colors duration-200 p-4">
                <div className="flex items-center gap-4 mb-4">
                  {c.pfp ? (
                    <img 
                      src={c.pfp} 
                      alt={c.username || "User"} 
                      className="w-10 h-10 rounded-lg object-cover border border-[#2a2a2a]" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#666666]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm">
                      {c.username || "Unknown User"}
                    </div>
                    {c.twitter && (
                      <div className="text-xs text-[#888888]">@{c.twitter}</div>
                    )}
                  </div>
                  <div className={`text-xs rounded-full px-2 py-1 font-semibold border ${c.isCreator ? "bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]" : "bg-[#4488ff]/10 border-[#4488ff]/20 text-[#4488ff]"}`}>
                      {c.isCreator ? "Creator" : "Fee Share"}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[#666666] font-semibold mb-1 uppercase tracking-wide">Wallet</div>
                    <div className="font-mono text-xs break-all bg-[#0a0a0a] border border-[#2a2a2a] rounded-md p-2 text-[#cccccc]">
                      {c.wallet || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#666666] font-semibold mb-1 uppercase tracking-wide">Royalty</div>
                    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-md p-2 text-[#cccccc] font-medium">
                      {c.royaltyPct != null ? `${c.royaltyPct}%` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && !rows.length && !loading && (
          <div className="text-center py-8">
            <div className="text-[#666666] text-sm">Enter a contract address and press Find to get started</div>
          </div>
        )}
      </div>
    </div>
  );
}