"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

export default function WalletCheckPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4 relative overflow-hidden">
      {/* Wallet Check specific background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-24 left-20 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-48 right-32 w-28 h-28 bg-teal-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-28 left-1/4 w-36 h-36 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-4000"></div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent">
              Wallet Reliability Check
            </h1>
          </div>
          <p className="text-[#888888] text-base">
            AI-powered analysis of wallet activity and reliability metrics using on-chain data.
          </p>
        </header>

        <div className="max-w-2xl">
          <WalletReliabilityCard />
        </div>
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
      const params = new URLSearchParams({
        address: clean,
        pages: pages.toString()
      });
      
      const res = await fetch(`/api/analyze/wallet-reliability?${params}`);
      const raw = await res.text();
      const p = parseJsonSafe(raw);
      if (!p.ok) throw new Error(p.error);
      const j = p.data;
      if (!j.ok) throw new Error(j.error || "Analysis failed");
      
      setResults(j);
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
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-teal-950/20 backdrop-blur-sm p-6 hover:border-emerald-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-emerald-400 mb-1 font-semibold flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          AI Analysis
        </div>
        <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">Wallet Reliability Check</h2>
        <p className="text-[#8A8A8A] text-sm leading-relaxed">
          Get an AI-powered reliability score based on on-chain activity patterns.
        </p>
      </div>

      <div className="space-y-4">
        <div>
            <label className="block text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wide">
              Solana Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a Solana address"
              className="w-full rounded-xl bg-emerald-950/30 border border-emerald-500/30 px-4 py-3 text-emerald-100 placeholder:text-emerald-300/50 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all duration-200"
            />
        </div>

        <button
          onClick={analyzeWallet}
          disabled={loading || !address.trim()}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 font-semibold hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
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
                <div className="text-xs text-emerald-400 font-semibold mb-1 uppercase tracking-wide">Balance</div>
                <div className="font-mono text-sm text-green-200">
                  {results.metrics.solBalance != null ? `${results.metrics.solBalance} SOL` : "—"}
                </div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-3">
                <div className="text-xs text-emerald-400 font-semibold mb-1 uppercase tracking-wide">Transactions</div>
                <div className="font-mono text-sm text-green-200">
                  {results.metrics.txCount}
                </div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-3">
                <div className="text-xs text-emerald-400 font-semibold mb-1 uppercase tracking-wide">Age (Days)</div>
                <div className="font-mono text-sm text-green-200">
                  {results.metrics.ageDays != null ? results.metrics.ageDays : "—"}
                </div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-3">
                <div className="text-xs text-emerald-400 font-semibold mb-1 uppercase tracking-wide">Analyzed</div>
                <div className="font-mono text-xs text-green-200">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Reliability Score */}
            <div className="bg-black/50 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-emerald-400 font-semibold mb-1 uppercase tracking-wide">Reliability Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(results.ai.score)}`}>
                    {results.ai.score}/100
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full border font-medium text-sm ${getScoreBg(results.ai.score)} ${getScoreColor(results.ai.score)}`}>
                  {results.ai.rating}
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-black/50 border border-neutral-800 rounded-xl p-6">
              <div className="text-xs text-emerald-400 font-semibold mb-4 uppercase tracking-wide">AI Security Analysis</div>
              
              <div className="space-y-3 mb-4">
                {results.ai.bullets.map((bullet: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                    <div className="text-sm text-green-100">{bullet}</div>
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
                <div className="text-xs text-emerald-400 font-semibold mb-2 uppercase tracking-wide">Swap Activity</div>
                <div className="font-mono text-lg text-green-200">{results.metrics.swapCount}</div>
                <div className="text-xs text-neutral-400">Total swaps</div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-4">
                <div className="text-xs text-emerald-400 font-semibold mb-2 uppercase tracking-wide">Counterparties</div>
                <div className="font-mono text-lg text-green-200">{results.metrics.uniqueCounterparties}</div>
                <div className="text-xs text-neutral-400">Unique addresses</div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-4">
                <div className="text-xs text-emerald-400 font-semibold mb-2 uppercase tracking-wide">BAGS Claims</div>
                <div className="font-mono text-lg text-green-200">{results.metrics.bagsFeeClaims}</div>
                <div className="text-xs text-neutral-400">Fee claims detected</div>
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