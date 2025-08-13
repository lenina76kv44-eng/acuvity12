"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import ToolShell from "@/components/layout/ToolShell";
import GlowCard from "@/components/decor/GlowCard";
import TipsCallout from "@/components/decor/TipsCallout";
import { getJson } from "@/lib/clientFetch";

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

export default function WalletCheckPage() {
  return (
    <main className="min-h-screen text-white pt-4" style={{position:'relative', zIndex:1}}>
      <div className="max-w-4xl mx-auto px-4 py-8" style={{position:'relative', zIndex:1}}>
        <Breadcrumbs />
        
        <ToolShell
          title="Wallet Reliability Check"
          subtitle="AI-assisted score built from on-chain activity. Behavior only — private data is never used."
          right={<div style={{width:120,height:120,borderRadius:60, background:'radial-gradient(closest-side, rgba(0,243,110,.35), transparent)'}}/>}
        >
          <GlowCard><div style={{padding:18}}>
            <WalletReliabilityCard />
          </div></GlowCard>

          <div style={{marginTop:14}}>
            <TipsCallout title="Scoring guide" items={[
              '0–30: high risk — bot/mixer/abusive patterns likely.',
              '30–70: medium risk — mixed signals; confirm manually.',
              '70–100: low risk — healthy diversity and normal activity.'
            ]}/>
          </div>
        </ToolShell>
      </div>
    </main>
  );
}

function WalletReliabilityCard() {
  const [address, setAddress] = useState("");
  const [pages] = useState(10);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyzeWallet() {
    setLoading(true); 
    setError(""); 
    setResults(null);

    const clean = address.trim();
    if (!clean) {
      setError("Please enter a Solana address");
      setLoading(false);
      return;
    }

    if (clean.length < 32 || clean.length > 44) {
      setError("Invalid Solana address format");
      setLoading(false);
      return;
    }

    try {
      const res = await getJson(`/api/analyze/wallet-reliability?address=${encodeURIComponent(clean)}&pages=5`);
      setResults(res);
    } catch (e: any) {
      console.error("Wallet reliability analysis error:", e);
      setError("Analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && address.trim() && !loading) {
      analyzeWallet();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-green-500/10 border-green-500/30";
    if (score >= 40) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold">AI Analysis</div>
        <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">Wallet Reliability Check</h2>
        <p className="text-[#8A8A8A] text-sm leading-relaxed">
          Get an AI-powered reliability score based on on-chain activity patterns.
        </p>
      </div>

      <div className="space-y-4">
        <div>
            <label className="block text-xs font-semibold text-[#7AEFB8] mb-2 uppercase tracking-wide">
              Solana Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a Solana address"
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-green-100 placeholder:text-green-300/50 outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 input-animated"
            />
        </div>

        <button
          onClick={analyzeWallet}
          disabled={loading || !address.trim()}
          className="rounded-xl bg-green-600 text-black px-6 py-3 font-semibold hover:bg-green-500 active:bg-green-600 disabled:opacity-50 shadow-[0_0_0_1px_rgba(0,255,136,.2)] hover:shadow-[0_10px_30px_rgba(0,255,136,.15)] btn-animated"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>

        {error && (
          <div className="text-red-400 mt-3">{error}</div>
        )}

        {results && (
          <div className="mt-6 space-y-6">
            {/* Metrics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-3">
                <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide">Balance</div>
                <div className="font-mono text-sm text-green-200">
                  {results.features?.solBalance != null ? `${results.features.solBalance} SOL` : "—"}
                </div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-3">
                <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide">Transactions</div>
                <div className="font-mono text-sm text-green-200">
                  {results.features?.txCount || 0}
                </div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-3">
                <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide">Last Activity</div>
                <div className="font-mono text-sm text-green-200">
                  {results.features?.lastActivityAgoDays != null ? `${results.features.lastActivityAgoDays} days ago` : "—"}
                </div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-3">
                <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide">Analyzed</div>
                <div className="font-mono text-xs text-green-200">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Reliability Score */}
            <div className="bg-black/50 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide">Reliability Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(results.ai.score)}`}>
                    {results.ai.score}/100
                  </div>
                </div>
                {results.ai.usedAI && (
                  <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium">
                    AI Analysis
                  </div>
                )}
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-black/50 border border-neutral-800 rounded-xl p-6">
              <div className="text-xs text-[#7AEFB8] font-semibold mb-4 uppercase tracking-wide">AI Security Analysis</div>
              
              <div className="space-y-3 mb-4">
                {(results.ai.redFlags || []).map((flag: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-red-200">{flag}</div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-800">
                <div className="text-sm text-neutral-300 leading-relaxed">
                  {results.ai.summary}
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-4">
                <div className="text-xs text-[#7AEFB8] font-semibold mb-2 uppercase tracking-wide">Token Buys</div>
                <div className="font-mono text-lg text-green-200">{results.features?.buys || 0}</div>
                <div className="text-xs text-neutral-400">Purchase transactions</div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-4">
                <div className="text-xs text-[#7AEFB8] font-semibold mb-2 uppercase tracking-wide">Token Sells</div>
                <div className="font-mono text-lg text-green-200">{results.features?.sells || 0}</div>
                <div className="text-xs text-neutral-400">Sale transactions</div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-4">
                <div className="text-xs text-[#7AEFB8] font-semibold mb-2 uppercase tracking-wide">Recent Activity</div>
                <div className="font-mono text-lg text-green-200">{results.features?.recentTxs || 0}</div>
                <div className="text-xs text-neutral-400">Last 30 days</div>
              </div>
            </div>
          </div>
        )}

        {!error && !results && !loading && (
          <div className="text-green-300/60 mt-4 text-xs">
            Enter a Solana address and press Analyze to get an AI reliability assessment.
          </div>
        )}
      </div>
    </div>
  );
}