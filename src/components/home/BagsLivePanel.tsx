'use client';

import { useEffect, useState, useCallback } from 'react';

type Row = {
  id: string;
  url: string;
  chainId: string;
  dexId: string;
  base: { symbol: string; address: string };
  priceUsd: number;
  change24h: number;
  vol24h: number;
  liquidityUsd: number;
  fdv: number;
};

type Payload = {
  totals: {
    totalTokens: number;
    activePairs: number;
    volume24h: number;
    totalLiquidity: number;
  };
  list: Row[];
};

export default function BagsLivePanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch('/api/dexscreener/solana', { cache: 'no-store' });
      if (!r.ok) throw new Error(`${r.status}`);
      const j = (await r.json()) as Payload;
      setData(j);
    } catch (e: any) {
      setErr(`Failed to load: ${e?.message || 'error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000); // refresh every 60s
    return () => clearInterval(id);
  }, [load]);

  const t = data?.totals;
  const rows = data?.list || [];

  return (
    <section className="mt-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Live BAGS Markets
          </h2>
          <button
            onClick={load}
            className="rounded-md bg-emerald-600/30 px-3 py-1.5 text-emerald-300 hover:bg-emerald-500/40"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Stat label="TOTAL TOKENS" value={fmtInt(t?.totalTokens)} />
          <Stat label="ACTIVE PAIRS" value={fmtInt(t?.activePairs)} />
          <Stat label="24H VOLUME" value={fmtUsd(t?.volume24h)} />
          <Stat label="TOTAL LIQUIDITY" value={fmtUsd(t?.totalLiquidity)} />
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-neutral-400">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
                <th>PAIR</th>
                <th>CHAIN</th>
                <th>DEX</th>
                <th>PRICE (USD)</th>
                <th>24H Δ</th>
                <th>24H VOL</th>
                <th>LIQUIDITY</th>
                <th>FDV</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-neutral-400">
                    Loading…
                  </td>
                </tr>
              )}
              {err && !loading && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-red-400">
                    {err}
                  </td>
                </tr>
              )}
              {!loading &&
                !err &&
                rows.map((p) => (
                  <tr
                    key={p.id}
                    className="[&>td]:px-4 [&>td]:py-3 hover:bg-white/5"
                  >
                    <td className="font-medium text-white">
                      {p.base.symbol}/SOL
                    </td>
                    <td className="capitalize text-neutral-300">{p.chainId}</td>
                    <td className="capitalize text-neutral-300">{p.dexId}</td>
                    <td className="text-neutral-100">{fmtUsd(p.priceUsd)}</td>
                    <td
                      className={
                        p.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }
                    >
                      {fmtPct(p.change24h)}
                    </td>
                    <td className="text-neutral-100">{fmtUsd(p.vol24h)}</td>
                    <td className="text-neutral-100">
                      {fmtUsd(p.liquidityUsd)}
                    </td>
                    <td className="text-neutral-100">{fmtUsd(p.fdv)}</td>
                    <td>
                      {p.url ? (
                        <a
                          className="rounded-md bg-emerald-500/15 px-2 py-1 text-emerald-300 hover:bg-emerald-500/25"
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Dexscreener
                        </a>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-neutral-500">
          Data via api.dexscreener.com • auto-refresh every ~60s.
        </p>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/40 p-5">
      <div className="text-xs uppercase tracking-wider text-neutral-400">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-emerald-300">
        {value || '—'}
      </div>
    </div>
  );
}

function fmtUsd(v?: number) {
  const x = Number(v || 0);
  return '$' + x.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function fmtInt(v?: number) {
  const x = Number(v || 0);
  return x.toLocaleString();
}
function fmtPct(v?: number) {
  const x = Number(v || 0);
  const sign = x > 0 ? '+' : '';
  return sign + x.toFixed(2) + '%';
}