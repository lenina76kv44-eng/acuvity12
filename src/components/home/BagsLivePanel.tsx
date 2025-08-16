'use client';

import React from 'react';
import { useMarkets } from '@/src/hooks/useMarkets';
import { cf, kmb, pf } from '@/src/lib/number';

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="text-xs uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
    </div>
  );
}

export default function BagsLivePanel() {
  const { data, error, isLoading, refresh } = useMarkets('all');
  const stats = data?.stats;
  const rows = data?.list ?? [];

  return (
    <section className="mt-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Live BAGS Markets
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              {data ? `Updated` : isLoading ? 'Loading…' : error ? 'Error' : ''}
            </span>
            <button
              onClick={refresh}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatCard label="Total Tokens" value={stats ? stats.totalTokens : '—'} />
          <StatCard label="Active Pairs" value={stats ? stats.activePairs : '—'} />
          <StatCard label="24h Volume" value={stats ? `$${kmb(stats.volume24h)}` : '—'} />
          <StatCard label="Total Liquidity" value={stats ? `$${kmb(stats.totalLiquidity)}` : '—'} />
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="border-b border-zinc-800 px-4 py-3 text-sm text-zinc-400">
            Top Markets (by 24h volume)
          </div>

          {error && (
            <div className="px-4 py-6 text-sm text-red-400">
              {String(error?.message ?? 'Failed to load data')}
            </div>
          )}

          {!error && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-zinc-300">
                <thead className="bg-zinc-900/60 text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Pair</th>
                    <th className="px-4 py-3">Chain</th>
                    <th className="px-4 py-3">DEX</th>
                    <th className="px-4 py-3">Price (USD)</th>
                    <th className="px-4 py-3">24h Δ</th>
                    <th className="px-4 py-3">24h Vol</th>
                    <th className="px-4 py-3">Liquidity</th>
                    <th className="px-4 py-3">FDV</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {(isLoading ? Array.from({ length: 8 }) : rows).map((r: any, i: number) => (
                    <tr key={r?.id ?? i} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                      <td className="px-4 py-3 font-medium text-white">{isLoading ? '—' : r.pair}</td>
                      <td className="px-4 py-3">{isLoading ? '—' : r.chain}</td>
                      <td className="px-4 py-3 capitalize">{isLoading ? '—' : r.dex}</td>
                      <td className="px-4 py-3">{isLoading ? '—' : cf.format(r.priceUsd)}</td>
                      <td className="px-4 py-3">
                        {isLoading ? '—' : (
                          <span className={r.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {pf.format(r.change24h)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{isLoading ? '—' : `$${kmb(r.vol24h)}`}</td>
                      <td className="px-4 py-3">{isLoading ? '—' : `$${kmb(r.liquidity)}`}</td>
                      <td className="px-4 py-3">{isLoading ? '—' : `$${kmb(r.fdv)}`}</td>
                      <td className="px-4 py-3">
                        {!isLoading && r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md bg-emerald-700/80 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-600"
                          >
                            Dexscreener
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}