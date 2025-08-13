"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import ToolShell from "@/components/layout/ToolShell";
import GlowCard from "@/components/decor/GlowCard";
import HowItWorks from "@/components/decor/HowItWorks";
import { getJson } from "@/lib/clientFetch";

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

export default function TokenCreatorsPage() {
  return (
    <main className="min-h-screen text-white pt-4" style={{position:'relative', zIndex:1}}>
      <div className="max-w-4xl mx-auto px-4 py-8" style={{position:'relative', zIndex:1}}>
        <Breadcrumbs />
        
        <ToolShell
          title="CA Finder Search"
          subtitle="Find creators and fee splits by contract address. Inspect deployer behavior fast."
        >
          <GlowCard><div style={{padding:18}}>
            <CaToCreatorsCard />
          </div></GlowCard>

          <div style={{marginTop:18}}>
            <HowItWorks steps={[
              {n:1,title:'Paste contract',desc:'We resolve creator address and fee routing.'},
              {n:2,title:'Inspect splits',desc:'Understand revenue share, mints and suspicious patterns.'},
              {n:3,title:'Follow up',desc:'Open creator in Wallet Check for deeper behavior analysis.'}
            ]}/>
          </div>
        </ToolShell>
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
      const data = await getJson(`/api/token-creators?ca=${encodeURIComponent(clean)}`);
      if (!data.ok) throw new Error(data.error || "Request failed");
      
      const allResults = [
        ...(data.creators || []).map((c: any) => ({
          address: c.address,
          share: c.share,
          type: 'DAS Creator'
        })),
        ...(data.inferredTopSigners || []).map((s: any) => ({
          address: s.address,
          hits: s.hits,
          type: 'Top Signer'
        }))
      ];
      
      setRows(allResults);
      if (!allResults.length) setError("No creators found for this CA.");
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
        <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold">Contract Address</div>
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
            className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-green-100 placeholder:text-green-300/50 outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 input-animated"
          />
          <button
            onClick={fetchCreators}
            disabled={loading || !ca.trim()}
            className="rounded-xl bg-green-600 text-black px-5 py-3 font-semibold hover:bg-green-500 active:bg-green-600 disabled:opacity-50 shadow-[0_0_0_1px_rgba(0,255,136,.2)] hover:shadow-[0_10px_30px_rgba(0,255,136,.15)] btn-animated"
          >
            {loading ? "Finding…" : "Find"}
          </button>
        </div>

        {error && (
          <div className="text-red-400 mt-3">{error}</div>
        )}

        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#7AEFB8] mb-3 uppercase tracking-wide">
              Creators Found: {rows.length}
            </div>
            {rows.map((c, i) => (
              <div key={i} className="rounded-xl border border-neutral-800 bg-black/50 p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#666666]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-green-100">
                      {c.type}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {c.type === 'DAS Creator' ? `Share: ${c.share || 0}%` : `${c.hits} transactions`}
                    </div>
                  </div>
                  <span className={
                    "px-2 py-1 rounded-full border font-medium text-xs flex-shrink-0 " +
                    (c.type === 'DAS Creator'
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-300")
                  }>
                    {c.type === 'DAS Creator' ? "Creator" : "Signer"}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div>
                    <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide">Address</div>
                    <div className="font-mono text-xs break-all bg-black/50 border border-neutral-800 rounded-xl p-3 text-green-200">
                      {c.address || "—"}
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