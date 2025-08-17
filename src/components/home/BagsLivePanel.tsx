"use client";

import { useEffect, useState } from "react";

type Row = {
  pair: string;
  priceUsd: number | null;
  change24h: number | null;
  vol24hUsd: number | null;
  liquidityUsd: number | null;
  fdvUsd: number | null;
  link: string | null;
  chain?: string;
  dex?: string;
};

type Resp = {
  lastUpdated: number;
  stats: {
    totalTokens24h: number;
    activeTokens: number;
    volume24hUsd: number;
    totalLiquidityUsd: number;
  };
  top: Row[];
  note?: string;
  error?: string;
};

function k(n: number | null | undefined) {
  if (!n || !isFinite(n)) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n/1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(n/1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n/1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

export default function BagsLivePanel() {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/bags/live", { cache: "no-store" });
      const json: Resp = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to load bags live:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000); // auto refresh 60s
    return () => clearInterval(id);
  }, []);

  const stats = data?.stats;

  return (
    <section className="mt-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Live <span className="text-emerald-400">BAGS</span> Markets
          </h2>
          <button
            onClick={load}
            className="rounded-lg bg-emerald-600/20 px-3 py-1 text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-600/30"
          >
            Refresh
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Kpi loading={loading} label="TOTAL TOKENS (24h)" value={stats?.totalTokens24h ?? 0} />
          <Kpi loading={loading} label="ACTIVE TOKENS" value={stats?.activeTokens ?? 0} />
          <Kpi loading={loading} label="24H VOLUME" value={k(stats?.volume24hUsd)} wide />
          <Kpi loading={loading} label="TOTAL LIQUIDITY" value={k(stats?.totalLiquidityUsd)} wide />
        </div>

        {/* Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-emerald-700/30 bg-neutral-900/60 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
          <div className="border-b border-emerald-700/20 px-4 py-3 text-sm text-emerald-300">
            Top markets by <span className="font-medium text-emerald-400">FDV</span> (best pair per token)
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-900/70 text-neutral-300">
                <tr>
                  <Th>Pair</Th>
                  <Th className="text-right">Price (USD)</Th>
                  <Th className="text-right">24h Δ</Th>
                  <Th className="text-right">24h Vol</Th>
                  <Th className="text-right">Liquidity</Th>
                  <Th className="text-right">FDV</Th>
                  <Th className="text-right">Link</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {loading && (!data?.top || data.top.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">Loading…</td>
                  </tr>
                )}
                {!loading && (!data?.top || data.top.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">No data</td>
                  </tr>
                )}
                {(data?.top ?? []).map((r, i) => {
                  const price = r.priceUsd ? `$${Number(r.priceUsd).toFixed(6)}` : '—';
                  const change = r.change24h !== null ? `${r.change24h > 0 ? '+' : ''}${r.change24h.toFixed(2)}%` : '—';
                  const vol = k(r.vol24hUsd);
                  const liq = k(r.liquidityUsd);
                  const fdv = k(r.fdvUsd);
                  return (
                    <tr key={i} className="hover:bg-neutral-900/60">
                      <Td>{r.pair}</Td>
                      <Td right>{price}</Td>
                      <Td right className={r.change24h !== null ? (r.change24h >= 0 ? 'text-emerald-400' : 'text-red-400') : ''}>{change}</Td>
                      <Td right>{vol}</Td>
                      <Td right>{liq}</Td>
                      <Td right>{fdv}</Td>
                      <Td right>
                        {r.link ? (
                          <a
                            className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/40"
                            href={r.link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Dexscreener
                          </a>
                        ) : '—'}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value, loading, wide }: { label: string; value: string | number; loading?: boolean; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-emerald-700/30 bg-neutral-900/60 p-5 shadow-[0_0_30px_rgba(16,185,129,0.08)] ${wide ? 'md:col-span-2' : ''}`}>
      <div className="text-xs font-medium uppercase tracking-wider text-emerald-300">{label}</div>
      <div className="mt-2 text-3xl font-bold text-white tabular-nums">
        {loading ? <span className="animate-pulse text-neutral-500">…</span> : value}
      </div>
    </div>
  );
}

function Th({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <th className={`px-4 py-3 text-left font-semibold tracking-wide ${className}`}>{children}</th>;
}
function Td({ children, right = false, className = '' }: React.PropsWithChildren<{ right?: boolean; className?: string }>) {
  return <td className={`px-4 py-3 ${right ? 'text-right' : ''} ${className}`}>{children}</td>;
}