'use client';

import useSWR from 'swr';
import { useRef } from 'react';
import { fetcher } from '@/src/lib/swrFetcher';

type LivePayload = {
  lastUpdated: number;
  stats: {
    totalTokens24h: number;
    activeTokens: number;
    volume24hUsd: number;
    totalLiquidityUsd: number;
  };
  top: {
    pair: string;
    priceUsd: number;
    change24h: number | null;
    vol24hUsd: number;
    liquidityUsd: number;
    fdvUsd: number;
    link: string | null;
    chain?: string;
    dex?: string;
  }[];
  note?: string;
  error?: string;
};

function prettyUSD(n: number) {
  if (!Number.isFinite(n)) return '$0';
  if (n >= 1_000_000_000) return `$${(n/1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n/1_000).toFixed(2)}K`;
  return `$${n.toLocaleString()}`;
}

const green = 'text-[#00ff88]';
const greenBg = 'bg-[#00ff88]/10';
const card = 'rounded-2xl border border-white/10 bg-black/40 shadow-[0_0_40px_rgba(0,255,136,0.05)]';

export default function BagsLivePanel() {
  const lastGood = useRef<LivePayload | null>(null);

  const { data, isLoading, mutate } = useSWR<LivePayload>(
    '/api/bags/live',
    fetcher,
    { refreshInterval: 60_000, dedupingInterval: 55_000, revalidateOnFocus: false, keepPreviousData: true }
  );

  const payload = data?.error ? (lastGood.current ?? null) : (data ?? lastGood.current);
  if (data && !data.error) lastGood.current = data;

  const StatsCard = ({ title, value }: { title: string; value: string }) => (
    <div className={`${card} p-6`}>
      <div className="text-sm uppercase tracking-wide text-white/60">{title}</div>
      <div className={`mt-2 text-3xl font-semibold ${green}`}>{value}</div>
    </div>
  );

  return (
    <section className="mt-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Live <span className={green}>BAGS</span> Markets
          </h2>
          <button
            onClick={() => mutate('/api/bags/live?nocache=1')}
            className="rounded-lg border border-[#00ff88]/40 px-4 py-2 text-sm font-medium text-white hover:bg-[#00ff88]/10"
          >
            Refresh
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatsCard title="Total Tokens (24h)" value={isLoading && !payload ? '…' : String(payload?.stats.totalTokens24h ?? 0)} />
          <StatsCard title="Active Tokens" value={isLoading && !payload ? '…' : String(payload?.stats.activeTokens ?? 0)} />
          <StatsCard title="24h Volume" value={isLoading && !payload ? '…' : prettyUSD(payload?.stats.volume24hUsd ?? 0)} />
          <StatsCard title="Total Liquidity" value={isLoading && !payload ? '…' : prettyUSD(payload?.stats.totalLiquidityUsd ?? 0)} />
        </div>

        {/* TABLE */}
        <div className={`${card} mt-6 overflow-hidden`}>
          <div className="border-b border-white/10 px-4 py-3 text-sm text-white/70">
            Top markets by FDV (program-based discovery)
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-black/30">
                <tr className="text-left text-xs uppercase tracking-wide text-white/60">
                  <th className="px-4 py-3">Pair</th>
                  <th className="px-4 py-3">Price (USD)</th>
                  <th className="px-4 py-3">24h Δ</th>
                  <th className="px-4 py-3">24h Vol</th>
                  <th className="px-4 py-3">Liquidity</th>
                  <th className="px-4 py-3">FDV</th>
                  <th className="px-4 py-3">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm">
                {(!payload || payload.top.length === 0) && (
                  <tr><td className="px-4 py-5 text-white/50" colSpan={7}>No markets yet (or still indexing).</td></tr>
                )}
                {payload?.top.map((r, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-white">{r.pair}</td>
                    <td className={`px-4 py-3 ${green}`}>{prettyUSD(r.priceUsd)}</td>
                    <td className="px-4 py-3">
                      {r.change24h === null ? '—' : (
                        <span className={r.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {r.change24h.toFixed(2)}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/90">{prettyUSD(r.vol24hUsd)}</td>
                    <td className="px-4 py-3 text-white/90">{prettyUSD(r.liquidityUsd)}</td>
                    <td className="px-4 py-3 text-white/90">{prettyUSD(r.fdvUsd)}</td>
                    <td className="px-4 py-3">
                      {r.link ? (
                        <a href={r.link} target="_blank" className="rounded-md border border-[#00ff88]/40 px-2 py-1 text-xs text-white hover:bg-[#00ff88]/10">Dexscreener</a>
                      ) : <span className="text-white/40">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-white/10 px-4 py-2 text-[11px] text-white/40">
            Data via Helius + DexScreener • Auto-refresh every 60s • Program-based discovery (no suffix filters)
          </div>
        </div>
      </div>
    </section>
  );
}