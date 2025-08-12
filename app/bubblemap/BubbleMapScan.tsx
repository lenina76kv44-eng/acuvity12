import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertCircle, Loader, ExternalLink, Copy, Info } from 'lucide-react';
import { getBoughtTokenMints, intersectMany, fetchTokenMetadata } from '../lib/solana';
import { batchResolveMetas, preloadJupiterList, fallbackAvatar, type TokenMeta } from '../lib/tokenMeta';
import { ICONS } from '../constants/icons';

interface SharedToken {
  mint: string;
  symbol?: string;
  name?: string;
  wallets: string[];
  count: number;
  firstSeen?: string;
}

interface AnalysisResult {
  sharedTokens: SharedToken[];
  perWallet: Record<string, string[]>;
  totalAnalyzed: number;
}

const BubbleMapScan: React.FC = () => {
  const [addresses, setAddresses] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [limit, setLimit] = useState(100);
  const [pages, setPages] = useState(5);
  const [metaMap, setMetaMap] = useState<Record<string, TokenMeta | null>>({});

  const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY || '460385eb-01ae-4371-9b8d-c2fe94cafd28';

  // предзагружаем список Jupiter один раз
  useEffect(() => {
    preloadJupiterList().catch(() => {});
  }, []);

  // Безопасный парсинг JSON
  async function safeJson(res: Response) {
    if (!res || !res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try {
        return await res.json();
      } catch {
        return null;
      }
    }
    try { 
      const txt = await res.text();
      return JSON.parse(txt); 
    } catch { 
      return null; 
    }
  }

  // Function to fetch transactions with pagination
  const fetchAllTransactions = async (address: string): Promise<any[]> => {
    let before: string | undefined = undefined;
    const allTransactions: any[] = [];

    console.log(`Fetching transactions for ${address}...`);

    for (let page = 0; page < pages; page++) {
      try {
        const url = new URL(`https://api.helius.xyz/v0/addresses/${address}/transactions`);
        url.searchParams.set('api-key', HELIUS_API_KEY);
        if (before) {
          url.searchParams.set('before', before);
        }

        console.log(`Page ${page + 1}/${pages} for ${address.slice(0, 8)}...`);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.log('Rate limit hit, waiting...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            page--; // Retry this page
            continue;
          }
          
          if (response.status === 404) {
            console.log(`No transactions found for ${address}`);
            break;
          }

          const errorText = await response.text();
          console.error(`API error ${response.status}: ${errorText}`);
          break; // Stop trying this wallet instead of throwing
        }

        const pageData = await safeJson(response);
        
        if (!pageData || !Array.isArray(pageData) || pageData.length === 0) {
          console.log(`No more transactions for ${address}`);
          break;
        }

        console.log(`Got ${pageData.length} transactions for page ${page + 1}`);
        allTransactions.push(...pageData);
        
        before = pageData[pageData.length - 1]?.signature;
        
        // Add delay between requests
        if (page < pages - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // If we got less than expected, probably no more pages
        if (pageData.length < 100) {
          console.log(`Got ${pageData.length} transactions, likely last page`);
          break;
        }

      } catch (error) {
        console.error(`Error fetching page ${page + 1} for ${address}:`, error);
        break; // Continue with other wallets instead of failing completely
      }
    }

    console.log(`Total transactions for ${address}: ${allTransactions.length}`);
    return allTransactions;
  };

  const handleAnalyze = async () => {
    const addressList = addresses
      .split(/[\n,;]/)
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

    // Валидация Solana адресов
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

      // Получаем транзакции для каждого кошелька
      const walletData: Array<{ address: string; boughtTokens: Set<string> }> = [];

      for (let i = 0; i < addressList.length; i++) {
        const address = addressList[i];
        setAnalysisStep(`Analyzing wallet ${i + 1}/${addressList.length}: ${address.slice(0, 8)}...`);

        try {
          const transactions = await fetchAllTransactions(address);
          console.log(`\n=== WALLET ANALYSIS ${address} ===`);
          console.log(`Total transactions: ${transactions.length}`);

          const boughtTokens = new Set<string>();

          // Analyze each transaction
          for (const tx of transactions) {
            try {
              const txBoughtTokens = getBoughtTokenMints(tx, address);
              for (const mint of txBoughtTokens) {
                boughtTokens.add(mint);
              }
            } catch (txError) {
              console.error('Error processing transaction:', txError);
            }
          }

          console.log(`Found unique purchased tokens: ${boughtTokens.size}`);
          console.log('Purchased tokens:', [...boughtTokens]);

          walletData.push({ address, boughtTokens });

        } catch (error) {
          console.error(`Wallet analysis error ${address}:`, error);
          // Continue with other wallets instead of failing completely
          console.log(`Skipping wallet ${address.slice(0, 8)}... due to error`);
          walletData.push({ address, boughtTokens: new Set<string>() });
        }
      }

      setAnalysisStep('Finding shared tokens...');

      // Находим пересечения
      const tokenSets = walletData.map(w => w.boughtTokens);
      const sharedMints = intersectMany(tokenSets);

      console.log('\n=== INTERSECTION RESULTS ===');
      console.log('Shared tokens (mints):', sharedMints);

      if (sharedMints.length === 0) {
        console.log('\n=== DETAILED DIAGNOSTICS ===');
        walletData.forEach(({ address, boughtTokens }) => {
          console.log(`${address}: ${boughtTokens.size} tokens`);
          console.log([...boughtTokens].slice(0, 10));
        });
        
        setResults({
          sharedTokens: [],
          perWallet: Object.fromEntries(walletData.map(w => [w.address, [...w.boughtTokens]])),
          totalAnalyzed: addressList.length
        });
        return;
      }

      setAnalysisStep('Loading token metadata...');

      // Получаем метаданные для всех найденных токенов
      try {
        const metas = await batchResolveMetas(sharedMints);
        setMetaMap(metas);
        console.log('Token metadata:', metas);
      } catch (e) {
        console.error('Token meta failed, using fallback', e);
        const fallbackMap: Record<string, TokenMeta | null> = {};
        sharedMints.forEach(m => {
          fallbackMap[m] = {
            name: 'Unknown',
            symbol: undefined,
            logoURI: undefined,
            sources: ['fallback']
          };
        });
        setMetaMap(fallbackMap);
      }

      // Формируем результат
      const sharedTokens: SharedToken[] = sharedMints.map(mint => {
        const meta = metaMap[mint];
        const walletsWithToken = walletData
          .filter(w => w.boughtTokens.has(mint))
          .map(w => w.address);

        return {
          mint,
          symbol: meta?.symbol || undefined,
          name: meta?.name || 'Unknown Token',
          wallets: walletsWithToken,
          count: walletsWithToken.length
        };
      });

      const perWallet: Record<string, string[]> = {};
      walletData.forEach(({ address, boughtTokens }) => {
        perWallet[address] = [...boughtTokens];
      });

      const finalResults: AnalysisResult = {
        sharedTokens,
        perWallet,
        totalAnalyzed: addressList.length
      };

      console.log('\n=== FINAL RESULTS ===');
      console.log('Shared tokens found:', sharedTokens.length);
      console.log('Details:', sharedTokens);

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

  const openGMGN = (mint: string) => {
    window.open(`https://gmgn.ai/sol/token/${mint}`, '_blank');
  };

  const shorten = (s: string, l = 4) =>
    s ? `${s.slice(0, l)}...${s.slice(-l)}` : '';

  return (
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img className="icon3d" src={ICONS.network} alt="Network graph" loading="lazy" />
            <h1 className="text-3xl font-black text-textLight font-display uppercase tracking-tight">
              BUBBLE MAP SCANNER
            </h1>
          </div>
          <p className="text-textMuted text-lg font-normal">
            Analyze token purchase history through Solana transactions
          </p>
        </div>

        <motion.div 
          className="card p-8 mb-8"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-bold text-textLight mb-4 uppercase tracking-wide">
            ANALYSIS SETTINGS
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-textMuted text-sm font-medium mb-2">
                Number of pages to analyze (max 10)
              </label>
              <input
                type="number"
                value={pages}
                onChange={(e) => setPages(Math.min(10, Math.max(1, Number(e.target.value))))}
                className="w-full input-primary"
                min="1"
                max="10"
              />
              <p className="text-textMuted text-xs mt-1">
                Each page contains ~100 transactions. More pages = deeper history analysis.
              </p>
            </div>
            <div>
              <label className="block text-textMuted text-sm font-medium mb-2">
                Analysis Status
              </label>
              <div className="bg-cardBg p-3 rounded border border-primary/20">
                <div className="text-textMuted text-sm">
                  Will analyze up to {pages * 100} transactions per wallet
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-textMuted text-sm font-medium mb-2">
              Solana addresses (2-10 addresses)
            </label>
            <motion.textarea
              value={addresses}
              onChange={(e) => setAddresses(e.target.value)}
              placeholder="Enter Solana addresses (one per line or comma-separated)&#10;Example:&#10;6SYnKRLoWwzpnfrZaRPRwLUZZQ1yyxt6ki4Ti1AXFaCd&#10;Ct3adbB5xq1X1sA6F6x51CVQ3BSMyf1qnnJH3JThQBTs"
              className="w-full h-32 input-primary resize-none font-mono text-sm"
              disabled={isAnalyzing}
              whileFocus={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            />
          </div>

          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-blue-400 font-medium mb-1">How Analysis Works</h4>
                <p className="text-textMuted text-sm">
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
              className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-red-400 font-medium mb-1">Error</h4>
                <p className="text-textMuted text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {isAnalyzing && analysisStep && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg flex items-center gap-3"
            >
              <Loader className="text-blue-400 animate-spin flex-shrink-0" size={20} />
              <div>
                <h4 className="text-blue-400 font-medium mb-1">Analysis in Progress...</h4>
                <p className="text-textMuted text-sm">{analysisStep}</p>
              </div>
            </motion.div>
          )}

          <motion.button
            onClick={handleAnalyze}
            disabled={isAnalyzing || addresses.trim().length === 0}
            className="w-full btn-primary text-lg py-4 flex items-center justify-center gap-3 font-bold uppercase tracking-wide"
            whileHover={{ scale: isAnalyzing ? 1 : 1.02 }}
            whileTap={{ scale: isAnalyzing ? 1 : 0.98 }}
          >
            {isAnalyzing ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
            <span>
              {isAnalyzing ? 'ANALYZING...' : 'START ANALYSIS'}
            </span>
          </motion.button>
        </motion.div>

        {results && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Общие токены */}
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <img className="icon3d" src={ICONS.shared} alt="Shared tokens" loading="lazy" />
                <h2 className="text-xl font-semibold text-textLight">
                  Shared Purchased Tokens ({results.sharedTokens.length})
                </h2>
              </div>
              
              {results.sharedTokens.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary/20">
                        <th className="text-left text-textLight py-3 px-4">Token</th>
                        <th className="text-left text-textLight py-3 px-4">Wallets</th>
                        <th className="text-left text-textLight py-3 px-4">Mint Address</th>
                        <th className="text-left text-textLight py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.sharedTokens.map((token, index) => (
                        <motion.tr 
                          key={token.mint} 
                          className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {/* Круглый логотип токена */}
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-primary/20 flex items-center justify-center flex-shrink-0">
                                {metaMap[token.mint]?.logoURI ? (
                                  <img
                                    src={metaMap[token.mint]?.logoURI}
                                    alt={token.name || token.mint}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      target.src = fallbackAvatar(token.mint);
                                    }}
                                  />
                                ) : (
                                  <img
                                    src={fallbackAvatar(token.mint)}
                                    alt={token.name || token.mint}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                )}
                              </div>
                              
                              {/* Кликабельное название токена */}
                              <div className="min-w-0">
                                <motion.a
                                  href={`https://gmgn.ai/sol/token/${token.mint}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-textLight hover:text-primary-600 transition-colors cursor-pointer"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  title="Open on GMGN"
                                >
                                  {metaMap[token.mint]?.name || token.name || 'Unknown'}
                                </motion.a>
                                {metaMap[token.mint]?.symbol && (
                                  <div className="text-textMuted text-sm truncate">
                                    {metaMap[token.mint]?.symbol}
                                  </div>
                                )}
                                <div className="text-textMuted text-xs font-mono">{shorten(token.mint, 6)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-primary font-semibold">
                              {token.count}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-primary font-semibold">
                              {token.count} wallets
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              <motion.button
                                onClick={() => copyToClipboard(token.mint)}
                                className="text-textMuted hover:text-primary transition-colors text-sm"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Copy mint address"
                              >
                                <Copy size={14} />
                              </motion.button>
                              <motion.button
                                onClick={() => window.open(`https://gmgn.ai/sol/token/${token.mint}`, '_blank')}
                                className="text-textMuted hover:text-primary transition-colors text-sm"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Open on GMGN"
                              >
                                <ExternalLink size={14} />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-textMuted">
                  No shared purchased tokens found between these wallets.
                  <div className="text-sm mt-2">
                    Try increasing the number of pages to analyze more transaction history.
                  </div>
                </div>
              )}
            </div>

            {/* Детали по кошелькам */}
            <div className="card p-8">
              <h2 className="text-xl font-semibold text-textLight mb-6">
                Wallet Details
              </h2>
              
              <div className="space-y-4">
                {Object.entries(results.perWallet).map(([address, tokens]) => (
                  <div key={address} className="border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-sm text-textLight">
                        {address.slice(0, 8)}...{address.slice(-8)}
                      </div>
                      <div className="text-primary font-semibold">
                        {tokens.length} tokens
                      </div>
                    </div>
                    <div className="text-textMuted text-xs">
                      Total unique tokens purchased: {tokens.length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default BubbleMapScan;