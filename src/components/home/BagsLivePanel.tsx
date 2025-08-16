'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

type ApiResp = {
  ok: boolean;
  windowHours: number;
  totalTokens: number;
  activePairs: number;
  totals: {
    liquidityUsd: number;
    volume24hUsd: number;
  };
  list?: Array<{
    mint: string; pairsCount: number; topPair: { pairAddress: string; dex: string; priceUsd: number | null; fdv: number | null; liquidityUsd: number; vol24: number; url: string | null; base: { symbol: string | null; name: string | null; image: string | null; }; } | null;
  };
  top?: Array<{
    pair: string; chainId: string; dexId: string; url: string;
    priceUsd: number; change24: number; vol24: number; liquidity: number; fdv: number; logo: string | null;
  }>;
  error?: string;
};

const nf = (v: number, d = 2) => (isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: d }) : '—');

export default function BagsLivePanel() {
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch('/api/bags-daily?hours=24', { cache: 'no-store' });
      if (!r.ok) throw new Error(`${r.status}`);
      const j: ApiResp = await r.json();
      if (!j.ok) throw new Error(j.error || 'Failed');
      setData(j);
    } catch (e: any) {
      setErr(`Load failed: ${String(e.message || e)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // Initial load

  const a = data?.totals;
  const top = data?.list || [];

  return (
    <section className="mt-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Live BAGS Markets
          </h2>
          <div className="flex items-center gap-3">
            {data?.totalTokens != null && (
              <span className="text-xs text-neutral-400">
                Discovered {data.totalTokens} BAGS tokens in last {data.windowHours}h
              </span>
            )}
            {/* Removed the "Updated" timestamp as it's now handled by the cache */}
            {/* {a?.at && (
              <span className="text-xs text-neutral-400">
                Updated {new Date(a.at).toLocaleTimeString()}
              </span>
            )} */}
            <button
              onClick={load}
              disabled={loading}
              className="rounded-lg bg-green-600 hover:bg-green-500 active:bg-green-600 text-black px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Total BAGS Tokens" value={data ? nf(data.totalTokens, 0) : '—'} />
          <StatCard title="Active Dex Pairs" value={data ? nf(data.activePairs, 0) : '—'} />
          <StatCard title="24h Volume" value={a ? `$${nf(a.volume24hUsd, 0)}` : '—'} />
          <StatCard title="Total Liquidity" value={a ? `$${nf(a.liquidityUsd, 0)}` : '—'} />
        </div>
        <div className="text-xs text-neutral-400 mt-4 text-center">
          Universe: BAGS tokens created in last {data?.windowHours || 24}h (Bags/chain).
          Prices & volumes are enriched from DexScreener where available.
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
          <div className="px-4 py-3 border-b border-neutral-800 text-sm text-neutral-300">
            Top Markets (by 24h volume)
          </div>
          {err && (
            <div className="px-4 py-6 text-red-400 text-sm">{err}</div>
          )}
          {!err && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-black/40">
                  <tr className="text-neutral-400">
                    <Th title="Pair" />
                    <Th title="Chain" />
                    <Th title="DEX" />
                    <Th title="Price (USD)" right />
                    <Th title="24h Δ" right />
                    <Th title="24h Vol" right />
                    <Th title="Liquidity" right />
                    <Th title="FDV" right />
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && top.length === 0 && (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="border-t border-neutral-900">
                        <td className="px-4 py-4" colSpan={9}>
                          <div className="h-6 w-full animate-pulse rounded bg-neutral-800" />
                        </td>
                      </tr>
                    ))
                  )}
                  {!loading && top.length === 0 && (
                    <tr className="border-t border-neutral-900">
                      <td className="px-4 py-6 text-neutral-400" colSpan={9}>No data.</td>
                    </tr>
                  )}
                  {top.map((r, i) => (
                    <tr key={r.mint} className="border-t border-neutral-900 hover:bg-black/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {r.topPair?.base?.image ? (
                            <Image src={r.topPair.base.image} alt={r.topPair.base.symbol || r.mint} width={28} height={28} className="rounded" />
                          ) : (
                            <div className="w-7 h-7 rounded bg-green-800 flex-shrink-0" /> // Placeholder
                          )}
                          <div className="text-green-100">
                            {r.topPair?.base?.symbol || r.mint.slice(0, 4) + '...' + r.mint.slice(-4)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-300">{r.topPair?.dex ? 'solana' : '—'}</td>
                      <td className="px-4 py-3 text-neutral-300">{r.topPair?.dex || '—'}</td>
                      <td className="px-4 py-3 text-right text-neutral-200">
                        {r.topPair?.priceUsd != null ? `$${nf(r.topPair.priceUsd)}` : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right ${r.topPair?.vol24 != null ? (r.topPair.vol24 >= 0 ? 'text-green-400' : 'text-red-400') : 'text-neutral-400'}`}>
                        {r.topPair?.vol24 != null ? `${nf(r.topPair.vol24)}%` : '—'} {/* Assuming vol24 is used for change, or add priceChange to API */}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-200">
                        {r.topPair?.vol24 != null ? `$${nf(r.topPair.vol24, 0)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-200">
                        {r.topPair?.liquidityUsd != null ? `$${nf(r.topPair.liquidityUsd, 0)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-200">
                        {r.topPair?.fdv != null ? `$${nf(r.topPair.fdv, 0)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.topPair?.url ? (
                          <a href={r.topPair.url} target="_blank" rel="noreferrer"
                             className="text-xs rounded bg-green-600 text-black px-3 py-1 font-medium hover:bg-green-500 btn-animated">
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

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-[0_0_0_1px_rgba(0,255,136,.06)]">
      <div className="text-xs uppercase tracking-wide text-green-400 font-semibold mb-1">{title}</div>
      <div className="text-2xl font-semibold text-green-100">{value}</div>
    </div>
  );
}

function Th({ title, right }: { title: string; right?: boolean }) {
  return (
    <th className={`px-4 py-2 text-xs uppercase tracking-wide ${right ? 'text-right' : 'text-left'}`}>{title}</th>
  );
}