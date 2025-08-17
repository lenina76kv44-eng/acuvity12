"use client";
import useSWR from "swr";
import { useMemo } from "react";

const fetcher = (u: string) => fetch(u).then(r => r.json());

function StatCard({label, value}:{label:string; value:string}) {
  return (
    <div className="rounded-2xl border border-zinc-700 bg-[#0B0E12]/70 p-6 shadow-[0_0_40px_rgba(0,255,120,0.05)]">
      <div className="text-xs uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function usd(n: number | null | undefined) {
  if (!n) return "$0";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function BagsLivePanel() {
  const { data, mutate, isLoading } = useSWR("/api/bags/live", fetcher, { refreshInterval: 60_000 });

  const m = data?.metrics;
  const list = data?.list || [];

  const cards = useMemo(() => [
    { label: "24h New Tokens", val: String(m?.created24h ?? 0) },
    { label: "24h Active Pairs", val: String(m?.activePairs24h ?? 0) },
    { label: "24h Total Volume", val: usd(m?.totalVolume24hUSD) },
    { label: "Total Tokens (all-time)", val: m?.totalTokensAllTime != null ? String(m.totalTokensAllTime) : "—" },
  ], [m]);

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Live BAGS Markets</h2>
        <button
          onClick={() => mutate()}
          className="rounded-lg bg-emerald-600/80 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => <StatCard key={i} label={c.label} value={c.val} />)}
      </div>

      {/* Table */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-700 bg-[#0B0E12]/70">
        <div className="border-b border-zinc-700 px-6 py-3 text-sm uppercase tracking-wider text-zinc-400">
          Top Tokens by Market Cap (24h, minted via Bags)
        </div>
        <div className="divide-y divide-zinc-800">
          <div className="grid grid-cols-[220px,110px,110px,130px,130px,1fr] px-6 py-3 text-xs uppercase tracking-wider text-zinc-400">
            <div>Pair</div><div>Price</div><div>24h Vol</div><div>Liquidity</div><div>Market Cap</div><div>Mint</div>
          </div>
          {isLoading && !data && (
            <div className="px-6 py-6 text-zinc-400">Loading…</div>
          )}
          {list.map((t: any) => (
            <div key={t.mint} className="grid grid-cols-[220px,110px,110px,130px,130px,1fr] items-center px-6 py-3 text-sm text-white">
              <div className="flex items-center gap-3">
                {t.logo ? <img src={t.logo} alt="" className="h-6 w-6 rounded" /> : <div className="h-6 w-6 rounded bg-emerald-600/30" />}
                <div className="truncate"><span className="text-emerald-400">{t.symbol || "?"}</span> <span className="text-zinc-400">/ SOL</span></div>
              </div>
              <div className="tabular-nums">{usd((t.price || 0) * 1)}</div>
              <div className="tabular-nums text-zinc-300">{usd(t.volume24hUSD)}</div>
              <div className="tabular-nums text-zinc-300">{usd(t.liquidityUSD)}</div>
              <div className="tabular-nums text-emerald-400">{usd(t.marketCapUSD)}</div>
              <div className="truncate text-zinc-400">{t.mint}</div>
            </div>
          ))}
          {!isLoading && list.length === 0 && (
            <div className="px-6 py-6 text-zinc-400">No tokens found in the last 24h.</div>
          )}
        </div>
        <div className="px-6 py-3 text-xs text-zinc-500">Data: Helius + Birdeye · auto-refresh every 60s.</div>
      </div>
    </section>
  );
}