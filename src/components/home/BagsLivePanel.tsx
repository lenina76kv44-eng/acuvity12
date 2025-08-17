"use client";

import { useEffect, useState } from "react";

type Row = {
  mint: string;
  symbol: string;
  priceUsd: number | null;
  change24h: number | null;
  vol24h: number | null;
  liquidityUsd: number | null;
  fdvUsd: number | null;
  link: string | null;
};

type Resp = {
  ok: boolean;
  kpis: {
    totalTokens24h: number;
    activeTokens: number;
    totalLiquidity: number;
    totalVol24h: number;
    allTimeTokens: number | null;
  };
  top: Row[];
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
      const res = await fetch("/api/bags/markets?h=24", { cache: "no-store" });
      const json: Resp = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to load bags markets:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000); // auto refresh 60s
    return () => clearInterval(id);
  }, []);

  const kpis = data?.kpis;

  return (
    <section className="mt-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Live <span className="text-[#00ff88]">BAGS</span> Markets
          </h2>
          <button
            onClick={load}
            className="rounded-xl bg-green-600 text-black px-4 py-2 font-semibold hover:bg-green-500 active:bg-green-600 btn-animated"
          >
            Refresh
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow card-hover animate-slide-in-up">
            <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold">Total Tokens (24h)</div>
            <div className="mt-2 text-3xl font-semibold text-[#00ff88]">
              {loading ? <span className="animate-pulse text-[#00ff88]/50">…</span> : (kpis?.totalTokens24h ?? 0)}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow card-hover animate-slide-in-up stagger-1">
            <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold">Active Tokens</div>
            <div className="mt-2 text-3xl font-semibold text-[#00ff88]">
              {loading ? <span className="animate-pulse text-[#00ff88]/50">…</span> : (kpis?.activeTokens ?? 0)}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow card-hover animate-slide-in-up stagger-2">
            <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold">24h Volume</div>
            <div className="mt-2 text-3xl font-semibold text-[#00ff88]">
              {loading ? <span className="animate-pulse text-[#00ff88]/50">…</span> : k(kpis?.totalVol24h ?? 0)}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow card-hover animate-slide-in-up stagger-3">
            <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold">Total Liquidity</div>
            <div className="mt-2 text-3xl font-semibold text-[#00ff88]">
              {loading ? <span className="animate-pulse text-[#00ff88]/50">…</span> : k(kpis?.totalLiquidity ?? 0)}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
          <div className="border-b border-neutral-800 px-4 py-3 text-sm text-[#7AEFB8]">
            Top markets by <span className="font-medium text-[#00ff88]">FDV</span> (program-based discovery)
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/50 text-[#7AEFB8]">
                <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
                  <th className="font-semibold uppercase tracking-wide text-xs text-[#00ff88]">Pair</th>
                  <th className="font-semibold uppercase tracking-wide text-xs text-[#00ff88]">Price (USD)</th>
                  <th className="font-semibold uppercase tracking-wide text-xs text-[#00ff88]">24h Δ</th>
                  <th className="font-semibold uppercase tracking-wide text-xs text-[#00ff88]">24h Vol</th>
                  <th className="font-semibold uppercase tracking-wide text-xs text-[#00ff88]">Liquidity</th>
                  <th className="font-semibold uppercase tracking-wide text-xs text-[#00ff88]">FDV</th>
                  <th className="font-semibold uppercase tracking-wide text-xs text-[#00ff88]">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {loading && (!data?.top?.length) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#00ff88]/70">Loading…</td>
                  </tr>
                )}
                {(data?.top ?? []).map((r) => (
                  <tr key={r.mint} className="text-[#00ff88] hover:bg-black/50 hover-glow transition-all duration-200">
                    <td className="px-4 py-3 text-[#00ff88]">{r.symbol}/SOL</td>
                    <td className="px-4 py-3 text-[#00ff88]">{r.priceUsd ? `$${r.priceUsd.toFixed(6)}` : "—"}</td>
                    <td className="px-4 py-3 text-[#00ff88]">{r.change24h !== null ? `${r.change24h.toFixed(2)}%` : "—"}</td>
                    <td className="px-4 py-3 text-[#00ff88]">{k(r.vol24h)}</td>
                    <td className="px-4 py-3 text-[#00ff88]">{k(r.liquidityUsd)}</td>
                    <td className="px-4 py-3 text-[#00ff88]">{k(r.fdvUsd)}</td>
                    <td className="px-4 py-3">
                      {r.link ? (
                        <a 
                          href={r.link} 
                          target="_blank" 
                          rel="noreferrer"
                          className="rounded-lg bg-green-600 hover:bg-green-500 text-black px-3 py-1.5 text-xs font-semibold transition-colors duration-200 btn-animated"
                        >
                          Dexscreener
                        </a>
                      ) : (
                        <span className="text-[#00ff88]/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && (!data?.top?.length) && (
                  <tr>
                    <td className="px-4 py-6 text-[#00ff88]/70 text-center" colSpan={7}>
                      No markets found for the selected window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}