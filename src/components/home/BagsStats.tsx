// src/components/home/BagsStats.tsx
"use client";
import useSWR from "swr";

type Row = {
  mint: string;
  symbol: string;
  name: string;
  dex: string;
  priceUsd: number | null;
  change24h: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  fdvUsd: number | null;
  url?: string;
  logoURI?: string;
  chainId: string;
};

type Data = {
  tokens24h: number;
  activePairs: number;
  volume24hUsd: number;
  marketCapSumUsd: number;
  allTimeTokens: number | null;
  top: Row[];
};

const $$ = {
  usd(n?: number | null) {
    if (n == null) return "—";
    try { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n); }
    catch { return `$${Math.round(n)}`; }
  },
  num(n?: number | null) {
    if (n == null) return "—";
    return new Intl.NumberFormat("en-US").format(n);
  },
  pct(n?: number | null) {
    if (n == null) return "—";
    return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
  }
};

const fetcher = (u: string) => fetch(u).then(r => r.json());

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0b0f0c] to-black p-5 shadow-[0_0_40px_-20px_rgba(16,185,129,0.45)]">
      <div className="text-xs uppercase tracking-widest text-emerald-400/80">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

export default function BagsStats() {
  const { data, error, isLoading, mutate } = useSWR<{ ok: boolean; data?: Data }>(
    "/api/bags/markets",
    fetcher,
    { refreshInterval: 60_000 }
  );

  const d = data?.data;

  return (
    <section className="mt-14">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Live <span className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] bg-clip-text text-transparent">BAGS</span> Markets
          </h2>
          <button
            onClick={() => mutate()}
            className="rounded-xl bg-green-600 text-black px-4 py-2 font-semibold hover:bg-green-500 active:bg-green-600 btn-animated"
          >
            Refresh
          </button>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tokens created (24h)" value={isLoading ? "…" : $$.num(d?.tokens24h ?? 0)} />
          <StatCard label="Active pairs (24h volume > 0)" value={isLoading ? "…" : $$.num(d?.activePairs ?? 0)} />
          <StatCard label="Total 24h Volume" value={isLoading ? "…" : $$.usd(d?.volume24hUsd ?? 0)} />
          <StatCard label="Sum Market Cap (FDV)" value={isLoading ? "…" : $$.usd(d?.marketCapSumUsd ?? 0)} />
        </div>

        {/* Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/50 text-[#7AEFB8]">
                <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
                  <th className="font-semibold uppercase tracking-wide text-xs">Pair</th>
                  <th className="font-semibold uppercase tracking-wide text-xs">Chain</th>
                  <th className="font-semibold uppercase tracking-wide text-xs">DEX</th>
                  <th className="font-semibold uppercase tracking-wide text-xs">Price (USD)</th>
                  <th className="font-semibold uppercase tracking-wide text-xs">24h Δ</th>
                  <th className="font-semibold uppercase tracking-wide text-xs">24h Vol</th>
                  <th className="font-semibold uppercase tracking-wide text-xs">Liquidity</th>
                  <th className="font-semibold uppercase tracking-wide text-xs">FDV</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {(d?.top || []).map(row => (
                  <tr key={row.mint} className="text-green-100 hover:bg-black/50 hover-glow transition-all duration-200">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* token avatar if exists */}
                        {row.logoURI ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.logoURI} alt="" className="h-6 w-6 rounded-full border border-neutral-700" />
                        ) : (
                          <div className="h-6 w-6 rounded-full border border-neutral-700 bg-neutral-800" />
                        )}
                        <div className="leading-tight">
                          <div className="font-medium text-green-100">{row.symbol || row.mint.slice(0, 4)}</div>
                          <div className="text-xs text-neutral-400">{row.mint.slice(0, 8)}…</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">{row.chainId}</td>
                    <td className="px-4 py-3 text-neutral-300 capitalize">{row.dex}</td>
                    <td className="px-4 py-3 text-green-200">{row.priceUsd == null ? "—" : $$.usd(row.priceUsd)}</td>
                    <td className={`px-4 py-3 ${row.change24h == null ? "text-neutral-400" : row.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                      { $$.pct(row.change24h) }
                    </td>
                    <td className="px-4 py-3 text-green-200">{ $$.usd(row.volume24hUsd) }</td>
                    <td className="px-4 py-3 text-green-200">{ $$.usd(row.liquidityUsd) }</td>
                    <td className="px-4 py-3 text-green-200">{ $$.usd(row.fdvUsd) }</td>
                    <td className="px-4 py-3">
                      {row.url ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-green-600 hover:bg-green-500 text-black px-3 py-1.5 text-xs font-semibold transition-colors duration-200 btn-animated"
                        >
                          Dexscreener
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {!isLoading && (d?.top?.length ?? 0) === 0 && (
                  <tr><td className="px-4 py-10 text-center text-neutral-400" colSpan={9}>No recent BAGS tokens found in the last 24h.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-neutral-800 px-4 py-3 text-xs text-neutral-500">
            Data via api.dexscreener.com • Auto-refresh every ~60s • Filter: base mint ends with "BAGS"
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400 animate-bounce-in">Failed to load: {(error as any)?.message || "unknown error"}</p>
        )}
      </div>
    </section>
  );
}