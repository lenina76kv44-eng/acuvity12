"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { Shield, Brain, TrendingUp, Zap, Eye, AlertTriangle } from "lucide-react";

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

export default function WalletCheckPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-12 text-center animate-slide-in-up">
          <div className="mb-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#00ff88]/20 to-[#00cc6a]/20 border border-[#00ff88]/30 text-[#00ff88] text-sm font-semibold animate-glow-pulse">
              <Shield className="w-4 h-4 mr-2" />
              AI Security Analysis
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 find-title-shine animate-text-glow">
            Wallet Reliability Check
          </h1>
          <p className="text-[#888888] text-lg max-w-2xl mx-auto leading-relaxed">
            AI-powered analysis of wallet activity and reliability metrics using on-chain data.
          </p>
        </header>

        {/* Features Overview */}
        <section className="mb-12 animate-slide-in-up stagger-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 card-hover enhanced-glow animate-scale-in stagger-1">
              <div className="w-12 h-12 bg-[#00ff88]/10 rounded-xl flex items-center justify-center mb-4 animate-glow-pulse">
                <Brain className="w-6 h-6 text-[#00ff88]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Analysis</h3>
              <p className="text-gray-400 text-sm">Machine learning powered risk assessment and scoring</p>
            </div>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 card-hover enhanced-glow animate-scale-in stagger-2">
              <div className="w-12 h-12 bg-[#00ff88]/10 rounded-xl flex items-center justify-center mb-4 animate-glow-pulse">
                <TrendingUp className="w-6 h-6 text-[#00ff88]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Pattern Detection</h3>
              <p className="text-gray-400 text-sm">Advanced algorithms to identify suspicious behavior</p>
            </div>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 card-hover enhanced-glow animate-scale-in stagger-3">
              <div className="w-12 h-12 bg-[#00ff88]/10 rounded-xl flex items-center justify-center mb-4 animate-glow-pulse">
                <Eye className="w-6 h-6 text-[#00ff88]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real-time Data</h3>
              <p className="text-gray-400 text-sm">Live blockchain analysis with instant results</p>
            </div>
          </div>
        </section>
        <div className="max-w-2xl mx-auto animate-slide-in-up stagger-2">
          <WalletReliabilityCard />
        </div>

        {/* How it Works */}
        <section className="mt-16 animate-slide-in-up stagger-3">
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 card-hover enhanced-glow">
            <h2 className="text-2xl font-bold text-[#00ff88] mb-6 text-center animate-text-glow">How AI Analysis Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="animate-scale-in stagger-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-[#00ff88] rounded-full flex items-center justify-center text-black font-bold">1</div>
                  <h3 className="text-lg font-semibold text-white">Data Collection</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Our AI analyzes up to 1000 recent transactions, examining patterns, counterparties, 
                  token interactions, and behavioral indicators to build a comprehensive profile.
                </p>
              </div>
              <div className="animate-scale-in stagger-2">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-[#00ff88] rounded-full flex items-center justify-center text-black font-bold">2</div>
                  <h3 className="text-lg font-semibold text-white">Risk Scoring</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Advanced algorithms evaluate wallet age, balance, activity patterns, and BAGS token 
                  interactions to generate a reliability score from 1-100 with detailed insights.
                </p>
              </div>
            </div>
          </div>
        </section>
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
  const [isAnimating, setIsAnimating] = useState(false);

  async function analyzeWallet() {
    setIsAnimating(true);
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
      setTimeout(() => setIsAnimating(false), 300);
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
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow card-hover animate-slide-in-up hover:scale-105 transition-all duration-300">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold animate-glow-pulse">AI Analysis</div>
        <h2 className="text-xl font-semibold text-white mb-2 tracking-tight animate-text-glow">Wallet Reliability Check</h2>
        <p className="text-[#8A8A8A] text-sm leading-relaxed">
          Get an AI-powered reliability score based on on-chain activity patterns.
        </p>
      </div>

      <div className="space-y-4">
        <div>
            <label className="block text-xs font-semibold text-[#7AEFB8] mb-2 uppercase tracking-wide animate-glow-pulse">
              Solana Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a Solana address"
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-green-100 placeholder:text-green-300/50 outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 input-animated hover:scale-105 transition-all duration-200"
            />
        </div>

        <button
          onClick={analyzeWallet}
          disabled={loading || !address.trim()}
          className={`rounded-xl bg-green-600 text-black px-6 py-3 font-semibold hover:bg-green-500 active:bg-green-600 disabled:opacity-50 shadow-[0_0_0_1px_rgba(0,255,136,.2)] hover:shadow-[0_10px_30px_rgba(0,255,136,.15)] btn-animated hover:scale-110 transition-all duration-300 ${loading ? 'animate-pulse-glow' : ''}`}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              <span>Analyzing<span className="animate-loading-dots"></span></span>
            </div>
          ) : "Analyze"}
        </button>

        {error && (
          <div className="text-red-400 mt-3 animate-bounce-in hover-glow">{error}</div>
        )}

        {results && (
          <div className="mt-6 space-y-6 animate-slide-in-up">
            {/* Metrics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-3 hover-glow animate-scale-in stagger-1 hover:scale-110 transition-all duration-300">
                <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide animate-glow-pulse">Balance</div>
                <div className="font-mono text-sm text-green-200">
                  {results.metrics.solBalance != null ? `${results.metrics.solBalance} SOL` : "—"}
                </div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-3 hover-glow animate-scale-in stagger-2 hover:scale-110 transition-all duration-300">
                <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide animate-glow-pulse">Transactions</div>
                <div className="font-mono text-sm text-green-200">
                  {results.metrics.txCount}
                </div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-3 hover-glow animate-scale-in stagger-3 hover:scale-110 transition-all duration-300">
                <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide animate-glow-pulse">Age (Days)</div>
                <div className="font-mono text-sm text-green-200">
                  {results.metrics.ageDays != null ? results.metrics.ageDays : "—"}
                </div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-3 hover-glow animate-scale-in stagger-4 hover:scale-110 transition-all duration-300">
                <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide animate-glow-pulse">Analyzed</div>
                <div className="font-mono text-xs text-green-200">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Reliability Score */}
            <div className="bg-black/50 border border-neutral-800 rounded-xl p-6 hover-glow animate-bounce-in hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-[#7AEFB8] font-semibold mb-1 uppercase tracking-wide animate-glow-pulse">Reliability Score</div>
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
            <div className="bg-black/50 border border-neutral-800 rounded-xl p-6 hover-glow animate-slide-in-up hover:scale-105 transition-all duration-300">
              <div className="text-xs text-[#7AEFB8] font-semibold mb-4 uppercase tracking-wide animate-glow-pulse">AI Security Analysis</div>
              
              <div className="space-y-3 mb-4">
                {results.ai.bullets.map((bullet: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 animate-slide-in-left" style={{animationDelay: `${i * 0.1}s`}}>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-4 hover-glow animate-scale-in stagger-1 hover:scale-110 transition-all duration-300">
                <div className="text-xs text-[#7AEFB8] font-semibold mb-2 uppercase tracking-wide animate-glow-pulse">Swap Activity</div>
                <div className="font-mono text-lg text-green-200">{results.metrics.swapCount}</div>
                <div className="text-xs text-neutral-400">Total swaps</div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-4 hover-glow animate-scale-in stagger-2 hover:scale-110 transition-all duration-300">
                <div className="text-xs text-[#7AEFB8] font-semibold mb-2 uppercase tracking-wide animate-glow-pulse">Counterparties</div>
                <div className="font-mono text-lg text-green-200">{results.metrics.uniqueCounterparties}</div>
                <div className="text-xs text-neutral-400">Unique addresses</div>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-4 hover-glow animate-scale-in stagger-3 hover:scale-110 transition-all duration-300">
                <div className="text-xs text-[#7AEFB8] font-semibold mb-2 uppercase tracking-wide animate-glow-pulse">BAGS Claims</div>
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