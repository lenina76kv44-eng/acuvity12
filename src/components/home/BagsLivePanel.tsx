'use client';

import { useEffect, useState, useCallback } from 'react';
import { fmtUsd, fmtUsdPrecise, fmtNum, fmtPct } from '@/src/lib/number';

type Api = {
  totals: { allTimeTokens: number; new24h: number; volume24h: number; totalFdv: number };
  top: {
    pairAddress?: string; chainId?: string; dexId?: string; url?: string;
    name: string; priceUsd: number | null; change24h: number | null;
    volume24h: number | null; liquidityUsd: number | null; fdv: number | null; createdAt: number | null;
  }[];
  generatedAt: number;
};

export default function BagsLivePanel() {
  const [data, setData] = useState<Api | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/bags/metrics');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const t = data?.totals;

  return (
    <section className="mt-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Live BAGS Markets</h2>
          <button onClick={fetchData} className="rounded-md border border-emerald-500/50 px-3 py-1.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/10 transition">
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#0b0f0c] p-4 shadow-[0_0_60px_-20px_rgba(16,185,129,0.35)]">
            <div className="text-xs uppercase tracking-wide text-emerald-400">Total Tokens</div>
            <div className="mt-2 text-4xl font-bold text-white">{fmtNum(t?.allTimeTokens)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0b0f0c] p-4 shadow-[0_0_60px_-20px_rgba(16,185,129,0.35)]">
            <div className="text-xs uppercase tracking-wide text-emerald-400">New Tokens (24h)</div>
            <div className="mt-2 text-4xl font-bold text-white">{fmtNum(t?.new24h)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0b0f0c] p-4 shadow-[0_0_60px_-20px_rgba(16,185,129,0.35)]">
            <div className="text-xs uppercase tracking-wide text-emerald-400">24h Volume</div>
            <div className="mt-2 text-4xl font-bold text-white">{fmtUsd(t?.volume24h)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0b0f0c] p-4 shadow-[0_0_60px_-20px_rgba(16,185,129,0.35)]">
            <div className="text-xs uppercase tracking-wide text-emerald-400">Total FDV</div>
            <div className="mt-2 text-4xl font-bold text-white">{fmtUsd(t?.totalFdv)}</div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-[#0a0d0b] text-sm">
              <thead className="bg-[#0f1411] text-emerald-300/90">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Pair</th>
                  <th className="px-4 py-3 text-left font-medium">Chain</th>
                  <th className="px-4 py-3 text-left font-medium">DEX</th>
                  <th className="px-4 py-3 text-right font-medium">Price (USD)</th>
                  <th className="px-4 py-3 text-right font-medium">24h Δ</th>
                  <th className="px-4 py-3 text-right font-medium">24h Vol</th>
                  <th className="px-4 py-3 text-right font-medium">Liquidity</th>
                  <th className="px-4 py-3 text-right font-medium">FDV</th>
                  <th className="px-4 py-3 text-right font-medium">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/90">
                {(data?.top || []).map((r, i) => (
                  <tr key={`${r.chainId}-${r.pairAddress}-${i}`}>
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">{r.chainId || 'solana'}</td>
                    <td className="px-4 py-3">{r.dexId || '-'}</td>
                    <td className="px-4 py-3 text-right">{r.priceUsd != null ? fmtUsdPrecise(r.priceUsd) : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={Number(r.change24h) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {r.change24h != null ? fmtPct(r.change24h) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{r.volume24h != null ? fmtUsd(r.volume24h) : '-'}</td>
                    <td className="px-4 py-3 text-right">{r.liquidityUsd != null ? fmtUsd(r.liquidityUsd) : '-'}</td>
                    <td className="px-4 py-3 text-right">{r.fdv != null ? fmtUsd(r.fdv) : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      {r.url ? <a className="text-emerald-400 hover:underline" href={r.url} target="_blank" rel="noreferrer">Dexscreener</a> : '-'}
                    </td>
                  </tr>
                ))}
                {!isLoading && (!data?.top || data.top.length === 0) && (
                  <tr><td className="px-4 py-6 text-center text-white/60" colSpan={9}>
                    No BAGS tokens yet. Edit <code>src/config/bags.local.ts</code>.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-[#0f1411] px-4 py-2 text-right text-xs text-white/50">
            Data via Dexscreener (enriched) • Auto-refresh 60s
          </div>
        </div>
      </div>
    </section>
  );
}