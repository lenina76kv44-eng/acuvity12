'use client';

import { useEffect, useMemo, useState } from 'react';

type Metrics = {
  updatedAt: number;
  totals: {
    tokens24h: number;
    activeTokens: number;
    vol24hUsd: number;
    liquidityUsd: number;
  };
  top: Array<{
    mint: string;
    name?: string;
    priceUsd?: number;
    fdv?: number;
    liquidityUsd?: number;
    vol24hUsd?: number;
    url?: string;
    dexId?: string;
  }>;
};

function fmtUsd(n?: number) {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function Card({ title, children }:{ title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0f0a] p-5 shadow-[0_0_60px_rgba(0,255,136,0.05)]">
      <div className="text-xs uppercase tracking-widest text-[#00ff88]/80 mb-3">{title}</div>
      {children}
    </div>
  );
}

export default function BagsLivePanel() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load(first=false) {
    try {
      if (!first) setRefreshing(true);
      setErr(null);
      const res = await fetch('/api/bags/metrics', { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e:any) {
      setErr('Data temporarily unavailable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load(true);
    const id = setInterval(() => load(), 60_000);
    return () => clearInterval(id);
  }, []);

  const skeleton = (
    <div className="h-8 w-28 animate-pulse rounded-md bg-white/10" />
  );

  return (
    <section className="mt-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            <span className="text-white">Live </span>
            <span className="text-[#00ff88]">BAGS</span>
            <span className="text-white"> Markets</span>
          </h2>
          <button
            onClick={() => load()}
            className="rounded-lg bg-[#00ff88]/20 px-4 py-2 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/30 transition"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Total Tokens (24h)">
            <div className="text-4xl font-bold text-[#00ff88]">
              {loading ? skeleton : data?.totals.tokens24h ?? 0}
            </div>
          </Card>
          <Card title="Active Tokens">
            <div className="text-4xl font-bold text-[#00ff88]">
              {loading ? skeleton : data?.totals.activeTokens ?? 0}
            </div>
          </Card>
          <Card title="24h Volume">
            <div className="text-4xl font-bold text-[#00ff88]">
              {loading ? skeleton : fmtUsd(data?.totals.vol24hUsd)}
            </div>
          </Card>
          <Card title="Total Liquidity">
            <div className="text-4xl font-bold text-[#00ff88]">
              {loading ? skeleton : fmtUsd(data?.totals.liquidityUsd)}
            </div>
          </Card>
        </div>

        {/* Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f0a]">
          <div className="border-b border-white/10 px-4 py-3 text-sm uppercase tracking-widest text-[#00ff88]">
            Top markets by FDV (created in last 24h)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="text-xs uppercase text-[#00ff88]/80">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th>Pair</th>
                  <th>Price (USD)</th>
                  <th>24h Δ</th>
                  <th>24h Vol</th>
                  <th>Liquidity</th>
                  <th>FDV</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody className="text-sm text-white/90">
                {loading && (
                  <tr><td className="px-4 py-4" colSpan={7}>
                    <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
                  </td></tr>
                )}
                {!loading && data?.top?.length === 0 && (
                  <tr><td className="px-4 py-6 text-white/60" colSpan={7}>No markets detected for the last 24h window.</td></tr>
                )}
                {data?.top?.map((t) => (
                  <tr key={t.mint} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">{t.name ? `${t.name}/SOL` : `${t.mint.slice(0,4)}…/SOL`}</td>
                    <td className="px-4 py-3">{t.priceUsd ? `$${t.priceUsd.toFixed(6)}` : '—'}</td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3">{fmtUsd(t.vol24hUsd)}</td>
                    <td className="px-4 py-3">{fmtUsd(t.liquidityUsd)}</td>
                    <td className="px-4 py-3">{t.fdv ? fmtUsd(t.fdv) : '—'}</td>
                    <td className="px-4 py-3">
                      {t.url ? (
                        <a className="rounded bg-[#00ff88]/20 px-3 py-1 text-[#00ff88] hover:bg-[#00ff88]/30"
                           href={t.url} target="_blank" rel="noreferrer">Dexscreener</a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-white/10 px-4 py-3 text-xs text-white/50">
            Data via Helius + DexScreener • Auto-refresh every 60s • Program-based discovery
          </div>
        </div>

        {err && <div className="mt-4 text-sm text-red-400">{err}</div>}
      </div>
    </section>
  );
}