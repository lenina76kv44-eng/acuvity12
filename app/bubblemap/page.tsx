"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, AlertCircle, Loader, ExternalLink, Copy, Info } from "lucide-react";
import { getBoughtTokenMints, intersectMany, type EnhancedTx } from "@/src/lib/solana";
import { batchResolveMetas, preloadJupiterList, fallbackAvatar, type TokenMeta } from "@/src/lib/tokenMeta";
import { ICONS } from "@/src/constants/icons";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

type SharedToken = { mint: string; symbol?: string; name?: string; wallets: string[]; count: number; };
type AnalysisResult = { sharedTokens: SharedToken[]; perWallet: Record<string, string[]>; totalAnalyzed: number; };

function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)); }

async function fetchHeliusPage(address: string, before: string | undefined, limit: number) {
  const u = new URL(`/api/helius-proxy`, window.location.origin);
  u.searchParams.set("address", address);
  u.searchParams.set("limit", String(limit));
  if (before) u.searchParams.set("before", before);

  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const r = await fetch(u.toString(), { method:"GET", headers:{ "accept":"application/json" } });
      const raw = await r.text();
      if (!r.ok) {
        // retry on 429/5xx
        if ((r.status===429 || r.status===502 || r.status===503 || r.status===504) && attempt <= 3) {
          await sleep(350*attempt*attempt);
          continue;
        }
        throw new Error(`${r.status}: ${raw.slice(0,180)}`);
      }
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr as EnhancedTx[];
    } catch (e:any) {
      const transient = /timeout|network|fetch|socket|abort/i.test(String(e?.message||e));
      if (transient && attempt <= 3) { await sleep(350*attempt*attempt); continue; }
      throw e;
    }
  }
}

export default function BubbleMapPage() {
  const [addresses, setAddresses] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const pages = 10; // Fixed at maximum for comprehensive scan
  const limit = 100; // Fixed at optimal rate limit balance

  useEffect(()=>{ preloadJupiterList().catch(()=>{}); },[]);

  const handleAnalyze = async () => {
    const list = addresses
      .split(/[\n,;, ]+/)
      .map(s=>s.trim())
      .filter(Boolean);

    if (list.length < 2) { setError("Enter at least 2 Solana addresses"); return; }
    if (list.length > 10) { setError("Maximum 10 addresses at once"); return; }
    const invalid = list.filter(a => !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a) || /[OIl0]/.test(a));
    if (invalid.length) { setError(`Invalid Solana addresses: ${invalid.slice(0,3).join(", ")}`); return; }

    setIsAnalyzing(true); setError(null); setResults(null);

    try {
      setAnalysisStep("Fetching transaction history...");
      const per: Array<{ address:string; bought:Set<string> }> = [];

      for (let i=0; i<list.length; i++){
        const addr = list[i];
        setAnalysisStep(`Analyzing wallet ${i+1}/${list.length}…`);
        const txs: EnhancedTx[] = [];
        let before: string | undefined;
        let lim = limit;

        for (let p=0; p<pages; p++){
          try {
            const arr = await fetchHeliusPage(addr, before, lim);
            if (!arr.length) break;
            txs.push(...arr);
            before = arr[arr.length-1]?.signature;
            if (!before) break;
            await sleep(120);
          } catch (e:any) {
            const msg = String(e?.message||e);
            if (/^(429|502|503|504)/.test(msg) || /timeout|network|abort/i.test(msg)) {
              lim = Math.max(40, Math.floor(lim*0.7));
              await sleep(400);
              p--; // retry same page lighter
              continue;
            }
            console.warn(`Wallet ${addr} page error:`, msg);
            break;
          }
        }

        // Build purchased set
        const bought = new Set<string>();
        for (const tx of txs) {
          try {
            getBoughtTokenMints(tx, addr).forEach(m => bought.add(m));
          } catch {}
        }
        per.push({ address: addr, bought });
      }

      setAnalysisStep("Finding shared tokens…");
      const sets = per.map(x => x.bought);
      const sharedMints = intersectMany(sets);

      if (!sharedMints.length) {
        setResults({
          sharedTokens: [],
          perWallet: Object.fromEntries(per.map(x => [x.address, [...x.bought]])),
          totalAnalyzed: list.length
        });
        setAnalysisStep("");
        setIsAnalyzing(false);
        return;
      }

      setAnalysisStep("Loading token metadata…");
      const metas = await batchResolveMetas(sharedMints);

      const sharedTokens: SharedToken[] = sharedMints.map(m => {
        const meta = metas[m] || null;
        const owners = per.filter(x => x.bought.has(m)).map(x => x.address);
        return {
          mint: m,
          symbol: meta?.symbol || undefined,
          name: meta?.name || "Unknown Token",
          wallets: owners,
          count: owners.length
        };
      });

      setResults({
        sharedTokens,
        perWallet: Object.fromEntries(per.map(x => [x.address, [...x.bought]])),
        totalAnalyzed: list.length
      });
    } catch (e:any) {
      setError(`Analysis failed: ${String(e?.message||e)}`);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep("");
    }
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };
  const shorten = (s:string,l=6)=> s ? `${s.slice(0,l)}...${s.slice(-l)}` : "";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img className="w-10 h-10" src={ICONS.network} alt="Network graph" />
                <h1 className="text-3xl font-black text-white uppercase tracking-tight find-green-gradient">BUBBLEMAP — SHARED PURCHASES</h1>
              </div>
              <p className="text-neutral-400 text-lg">Find tokens multiple wallets **bought** on Solana. Even if later sold, we read history.</p>
            </div>

            <motion.div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 mb-8 find-glow find-hover" whileHover={{ y: -2 }} transition={{ duration: 0.3 }}>
              <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">Analysis settings</h2>

              <div className="mb-6">
                <label className="block text-neutral-400 text-sm mb-2">Solana addresses (2–10)</label>
                <motion.textarea
                  value={addresses}
                  onChange={(e)=>setAddresses(e.target.value)}
                  placeholder="Enter Solana addresses (comma, space or newline separated)"
                  className="w-full h-28 rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-white font-mono text-sm"
                  disabled={isAnalyzing}
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                />
              </div>

              <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-neutral-300 text-sm">
                    We detect buys from swaps, bonding curves (mint-to-buyer + SOL spend), and fallback incoming SPL + payment in the same tx.
                  </div>
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-900/20 border border-red-500/40 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-neutral-300 text-sm">{error}</div>
                </motion.div>
              )}

              {isAnalyzing && analysisStep && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-blue-900/20 border border-blue-500/40 rounded-xl flex items-center gap-3">
                  <Loader className="text-blue-400 animate-spin flex-shrink-0" size={20} />
                  <div className="text-neutral-300 text-sm">{analysisStep}</div>
                </motion.div>
              )}

              <motion.button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !addresses.trim()}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-500 text-black px-5 py-3 font-bold uppercase tracking-wide flex items-center justify-center gap-3 disabled:opacity-50"
                whileHover={{ scale: isAnalyzing ? 1 : 1.02 }}
                whileTap={{ scale: isAnalyzing ? 1 : 0.98 }}
              >
                {isAnalyzing ? <Loader className="animate-spin" size={18} /> : <Search size={18} />}
                {isAnalyzing ? "Analyzing..." : "Find shared tokens"}
              </motion.button>
            </motion.div>

            {results && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-8">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow">
                  <div className="flex items-center gap-3 mb-6">
                    <img className="w-8 h-8" src={ICONS.shared} alt="Shared tokens"/>
                    <h2 className="text-xl font-semibold text-white">Shared Purchased Tokens ({results.sharedTokens.length})</h2>
                  </div>

                  {results.sharedTokens.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neutral-800">
                            <th className="text-left text-neutral-300 py-3 px-4">Token</th>
                            <th className="text-left text-neutral-300 py-3 px-4">Wallets</th>
                            <th className="text-left text-neutral-300 py-3 px-4">Mint</th>
                            <th className="text-left text-neutral-300 py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.sharedTokens.map((t, i) => (
                            <motion.tr key={t.mint} className="border-b border-neutral-900 hover:bg-neutral-900/40 find-hover" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-neutral-800 flex items-center justify-center">
                                    <img
                                      src={t.mint ? `https://api.dexscreener.com/token-icons/solana/${t.mint}.png` : fallbackAvatar(t.mint)}
                                      onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = fallbackAvatar(t.mint); }}
                                      alt={t.name || t.mint}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <a href={`https://gmgn.ai/sol/token/${t.mint}`} target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-emerald-400 transition-colors">
                                      {t.name || "Unknown Token"}
                                    </a>
                                    {t.symbol && <div className="text-neutral-500 text-sm truncate">{t.symbol}</div>}
                                    <div className="text-neutral-500 text-xs font-mono">{shorten(t.mint)}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4"><span className="text-emerald-400 font-semibold">{t.count}</span></td>
                              <td className="py-4 px-4"><span className="text-neutral-300 font-mono">{shorten(t.mint, 8)}</span></td>
                              <td className="py-4 px-4">
                                <div className="flex gap-2">
                                  <button onClick={()=>copyToClipboard(t.mint)} className="text-neutral-400 hover:text-emerald-400 transition-colors" title="Copy mint"><Copy size={14}/></button>
                                  <button onClick={()=>window.open(`https://gmgn.ai/sol/token/${t.mint}`,'_blank')} className="text-neutral-400 hover:text-emerald-400 transition-colors" title="Open on GMGN"><ExternalLink size={14}/></button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-400">
                      No shared purchased tokens found.
                      <div className="text-sm mt-2">Try pages=10 or lower the per-page limit if RPC is throttling.</div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow">
                  <h2 className="text-xl font-semibold text-white mb-6">Wallet Details</h2>
                  <div className="space-y-4">
                    {Object.entries(results.perWallet).map(([addr, toks]) => (
                      <div key={addr} className="rounded-xl border border-neutral-800 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-mono text-sm text-white">{addr.slice(0,8)}...{addr.slice(-8)}</div>
                          <div className="text-emerald-400 font-semibold">{toks.length} tokens</div>
                        </div>
                        <div className="text-neutral-500 text-xs">Unique purchased tokens for this wallet.</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}