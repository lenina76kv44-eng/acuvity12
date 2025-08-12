"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertCircle, Loader, ExternalLink, Copy, Info } from 'lucide-react';
import { getBoughtTokenMints, type EnhancedTx } from '@/src/lib/solana';
import { batchResolveMetas, preloadJupiterList, fallbackAvatar, type TokenMeta } from '@/src/lib/tokenMeta';
import { ICONS } from '@/src/constants/icons';

interface SharedToken {
  mint: string;
  symbol?: string;
  name?: string;
  wallets: string[];
  count: number;
  meta?: {
    name?: string;
    symbol?: string;
    image?: string;
  } | null;
}

interface AnalysisResult {
  sharedTokens: SharedToken[];
  perWallet: Record<string, string[]>;
  totalAnalyzed: number;
}

function sleep(ms: number) { 
  return new Promise(r => setTimeout(r, ms)); 
}

async function fetchHeliusPage(address: string, before: string | undefined, limit: number) {
  const u = new URL(`/api/helius-proxy`, window.location.origin);
  u.searchParams.set("address", address);
  u.searchParams.set("limit", String(limit));
  if (before) u.searchParams.set("before", before);

  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const r = await fetch(u.toString(), { method: "GET", headers: { "accept": "application/json" } });
      const raw = await r.text();
      if (!r.ok) {
        // retry on 429/5xx
        if ((r.status === 429 || r.status === 502 || r.status === 503 || r.status === 504) && attempt <= 3) {
          await sleep(350 * attempt * attempt);
          continue;
        }
        throw new Error(`${r.status}: ${raw.slice(0, 180)}`);
      }
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr as EnhancedTx[];
    } catch (e: any) {
      const transient = /timeout|network|fetch|socket|abort/i.test(String(e?.message || e));
      if (transient && attempt <= 3) { 
        await sleep(350 * attempt * attempt); 
        continue; 
      }
      throw e;
    }
  }
}

const BubbleMapScan: React.FC = () => {
  const [addresses, setAddresses] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>('');

  // Fixed values - hidden from user
  const pages = 10;
  const limit = 100;

  // Preload Jupiter token list once
  useEffect(() => {
    preloadJupiterList().catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    const addressList = addresses
      .split(/[\n,;, ]+/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);

    if (addressList.length < 2) {
      setError('Enter at least 2 Solana addresses');
      return;
    }

    if (addressList.length > 10) {
      setError('Maximum 10 addresses at once');
      return;
    }

    // Validate Solana addresses
    const invalidAddresses = addressList.filter(addr => 
      !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr) || /[0OIl]/.test(addr)
    );
    
    if (invalidAddresses.length > 0) {
      setError(`Invalid Solana addresses: ${invalidAddresses.slice(0, 3).join(', ')}`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      console.log('=== ANALYSIS START ===');
      console.log('Addresses to analyze:', addressList);
      console.log('Parameters:', { limit, pages });

      setAnalysisStep('Fetching transaction history...');

      // Fetch transactions for each wallet
      const per: Array<{ address: string; bought: Set<string> }> = [];

      for (let i = 0; i < addressList.length; i++) {
        const address = addressList[i];
        setAnalysisStep(`Analyzing wallet ${i + 1}/${addressList.length}: ${address.slice(0, 8)}...`);

        try {
          const txs: EnhancedTx[] = [];
          let before: string | undefined;
          let lim = limit;

          for (let p = 0; p < pages; p++) {
            try {
              const arr = await fetchHeliusPage(address, before, lim);
              if (!arr.length) break;
              txs.push(...arr);
              before = arr[arr.length - 1]?.signature;
              if (!before) break;
              await sleep(120);
            } catch (e: any) {
              const msg = String(e?.message || e);
              if (/^(429|502|503|504)/.test(msg) || /timeout|network|abort/i.test(msg)) {
                lim = Math.max(40, Math.floor(lim * 0.7));
                await sleep(400);
                p--; // retry same page lighter
                continue;
              }
              console.warn(`Wallet ${address} page error:`, msg);
              break;
            }
          }

          console.log(`\n=== WALLET ANALYSIS ${address} ===`);
          console.log(`Total transactions: ${txs.length}`);

          const bought = new Set<string>();

          // Analyze each transaction
          for (const tx of txs) {
            try {
              const txBoughtTokens = getBoughtTokenMints(tx, address);
              for (const mint of txBoughtTokens) {
                bought.add(mint);
              }
            } catch (txError) {
              console.error('Error processing transaction:', txError);
            }
          }

          console.log(`Found unique purchased tokens: ${bought.size}`);
          console.log('Purchased tokens:', [...bought].slice(0, 10));

          per.push({ address, bought });

        } catch (error) {
          console.error(`Wallet analysis error ${address}:`, error);
          // Continue with other wallets instead of failing completely
          console.log(`Skipping wallet ${address.slice(0, 8)}... due to error`);
          per.push({ address, bought: new Set<string>() });
        }
      }

      setAnalysisStep('Finding shared tokens...');

      // Count by mint across wallets (≥2 wallets)
      const bag: Record<string, string[]> = {};
      per.forEach(({ address, bought }) => {
        bought.forEach(m => {
          (bag[m] ??= []).push(address);
        });
      });

      const shared = Object.entries(bag)
        .filter(([, owners]) => owners.length >= 2) // Key fix: ≥2 wallets
        .map(([mint, owners]) => ({ mint, wallets: owners, count: owners.length }))
        .sort((a, b) => b.count - a.count || a.mint.localeCompare(b.mint));

      console.log('\n=== SHARED TOKENS RESULTS ===');
      console.log('Shared tokens found:', shared.length);
      console.log('Details:', shared.slice(0, 5));

      if (!shared.length) {
        console.log('\n=== DETAILED DIAGNOSTICS ===');
        per.forEach(({ address, bought }) => {
          console.log(`${address}: ${bought.size} tokens`);
          console.log([...bought].slice(0, 10));
        });
        
        setResults({
          sharedTokens: [],
          perWallet: Object.fromEntries(per.map(w => [w.address, [...w.bought]])),
          totalAnalyzed: addressList.length
        });
        return;
      }

      setAnalysisStep('Loading token metadata...');

      // Get metadata for all found tokens
      const metas = await batchResolveMetas(shared.map(x => x.mint));
      console.log('Token metadata loaded:', Object.keys(metas).length);

      // Build final results
      const sharedTokens: SharedToken[] = shared.map(row => {
        const meta = metas[row.mint] || null;
        return {
          mint: row.mint,
          count: row.count,
          wallets: row.wallets,
          symbol: meta?.symbol || undefined,
          name: meta?.name || 'Unknown Token',
          meta: meta ? {
            name: meta.name,
            symbol: meta.symbol,
            image: meta.logoURI
          } : null
        };
      });

      const finalResults: AnalysisResult = {
        sharedTokens,
        perWallet: Object.fromEntries(per.map(({ address, bought }) => [address, [...bought]])),
        totalAnalyzed: addressList.length
      };

      console.log('\n=== FINAL RESULTS ===');
      console.log('Shared tokens found:', sharedTokens.length);

      setResults(finalResults);

    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Analysis error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shorten = (s: string, l = 6) =>
    s ? `${s.slice(0, l)}...${s.slice(-l)}` : '';

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 find-green-gradient">Shared Tokens Finder</h1>
          <p className="text-[#888888] text-base">
            Discover tokens purchased by multiple wallets. Analyze 2–10 addresses to find shared investments.
          </p>
        </header>

        <div className="max-w-4xl">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow find-hover">
            <div className="mb-6">
              <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold">Multi-Wallet Analysis</div>
              <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">Find Shared Token Purchases</h2>
              <p className="text-[#8A8A8A] text-sm leading-relaxed">
                Discover tokens that multiple wallets have purchased. Perfect for finding trending investments.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#7AEFB8] mb-2 uppercase tracking-wide">
                  Solana Addresses (2–10)
                </label>
                <textarea
                  value={addresses}
                  onChange={(e) => setAddresses(e.target.value)}
                  placeholder="Da63jxs..., 94bGHZ5e...&#10;(comma or newline separated)"
                  rows={3}
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-green-100 placeholder:text-green-300/50 outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 resize-none"
                  disabled={isAnalyzing}
                />
              </div>

              <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-blue-400 font-medium mb-1">How Analysis Works</h4>
                    <p className="text-neutral-300 text-sm">
                      Analyzes transaction history of each wallet to find tokens that were purchased (received through swaps or transfers). 
                      Even if tokens have been sold, they will be found in the history.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-900/20 border border-red-500/40 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-red-400 font-medium mb-1">Error</h4>
                    <p className="text-neutral-300 text-sm">{error}</p>
                  </div>
                </motion.div>
              )}

              {isAnalyzing && analysisStep && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-blue-900/20 border border-blue-500/40 rounded-xl flex items-center gap-3"
                >
                  <Loader className="text-blue-400 animate-spin flex-shrink-0" size={20} />
                  <div>
                    <h4 className="text-blue-400 font-medium mb-1">Analysis in Progress...</h4>
                    <p className="text-neutral-300 text-sm">{analysisStep}</p>
                  </div>
                </motion.div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !addresses.trim()}
                className="rounded-xl bg-green-600 text-black px-6 py-3 font-semibold hover:bg-green-500 active:bg-green-600 disabled:opacity-50 shadow-[0_0_0_1px_rgba(0,255,136,.2)] hover:shadow-[0_10px_30px_rgba(0,255,136,.15)] transition-all duration-200 flex items-center justify-center gap-3"
              >
                {isAnalyzing ? <Loader className="animate-spin" size={18} /> : <Search size={18} />}
                <span>{isAnalyzing ? 'Finding…' : 'Find'}</span>
              </button>

              {results && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-[#7AEFB8] uppercase tracking-wide">
                      Shared Tokens Found: {results.sharedTokens.length}
                    </div>
                    <div className="text-xs text-neutral-400">
                      Analyzed {results.totalAnalyzed} wallets (deep scan)
                    </div>
                  </div>

                  {results.sharedTokens.length > 0 ? (
                    <div className="space-y-2">
                      {results.sharedTokens.map((token: SharedToken, i: number) => (
                        <div key={i} className="rounded-xl border border-neutral-800 bg-black/50 p-4 find-hover">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {token.meta?.image ? (
                                <img
                                  src={token.meta.image}
                                  alt={token.meta.name || token.mint}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 rounded-lg border border-neutral-700 object-cover"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.src = fallbackAvatar(token.mint);
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg border border-neutral-700 bg-neutral-800 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8-2a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-green-100 mb-1">
                                {token.meta?.name || token.name || `${token.mint.slice(0,4)}…${token.mint.slice(-4)}`}
                              </div>
                              <div className="text-xs text-neutral-400 mb-2">
                                {token.meta?.symbol || token.symbol || "—"} • {token.count} wallet{token.count > 1 ? 's' : ''}
                              </div>
                              <div className="font-mono text-xs text-neutral-500 break-all">
                                {token.mint}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => copyToClipboard(token.mint)}
                                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-green-200 text-xs font-medium rounded-lg transition-colors"
                              >
                                Copy CA
                              </button>
                              <a
                                href={`https://solscan.io/token/${token.mint}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-black text-xs font-medium rounded-lg transition-colors"
                              >
                                Solscan
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-neutral-400 text-sm">
                        No shared tokens found. Try with different wallet addresses.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!error && !results && !isAnalyzing && (
                <div className="text-green-300/60 mt-4 text-xs">
                  Enter 2–10 Solana addresses to discover shared token purchases. Deep scan will analyze up to 1000 transactions per wallet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BubbleMapScan;