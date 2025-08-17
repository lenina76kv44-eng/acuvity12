// src/components/home/BagsLivePanel.tsx
'use client';

import * as React from 'react';
import { formatUsd } from '@/src/lib/dexscreener';

type Row = {
  baseToken: { address: string; symbol?: string };
  quoteToken: { symbol?: string };
  priceUsd?: string;
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  url?: string;
};

type ApiResp = {
  ok: boolean;
  updatedAt: number;
  totals: {
    tokens24h: number;
    activeTokens: number;
    volume24h: number;
    liquidityTotal: number;
  };
  list: Row[];
  countUniverse: number;
  error?: string;
};

export default function BagsLivePanel() {
  const [data, setData] = React.useState<ApiResp | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bags-live', { cache: 'no-store' });
      const j = (await res.json()) as ApiResp;
      setData(j);
    } catch (e) {
      setData({ ok: false, updatedAt: Date.now(), totals: { tokens24h: 0, activeTokens: 0, volume24h: 0, liquidityTotal: 0 }, list: [], countUniverse: 0, error: 'fetch failed' });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const t = data?.totals;
  const list = data?.list ?? [];

  return (
    <section className="mt-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Live <span className="text-[#00ff88]">BAGS</span> Markets
          </h2>
          <button
            onClick={load}
            className="rounded-lg bg-[#00ff88]/20 px-3 py-1 text-[#00ff88] ring-1 ring-[#00ff88]/30 hover:bg-[#00ff88]/30"
          >
            Refresh
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Kpi loading={loading} label="TOTAL TOKENS (24h)" value={t?.tokens24h ?? 0} />
          <Kpi loading={loading} label="ACTIVE TOKENS" value={t?.activeTokens ?? 0} />
          <Kpi loading={loading} label="24H VOLUME" value={formatUsd(t?.volume24h)} wide />
          <Kpi loading={loading} label="TOTAL LIQUIDITY" value={formatUsd(t?.liquidityTotal)} wide />
        </div>

        {/* Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-emerald-700/30 bg-neutral-900/60 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
          <div className="border-b border-emerald-700/20 px-4 py-3 text-sm text-emerald-300">
            Top markets by <span className="font-medium text-[#00ff88]">FDV</span> (best pair per token)
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-900/70 text-neutral-300">
                <tr>
                  <Th className="text-[#00ff88]">Pair</Th>
                  <Th className="text-right text-[#00ff88]">Price (USD)</Th>
                  <Th className="text-right text-[#00ff88]">24h Δ</Th>
                  <Th className="text-right text-[#00ff88]">24h Vol</Th>
                  <Th className="text-right text-[#00ff88]">Liquidity</Th>
                  <Th className="text-right text-[#00ff88]">FDV</Th>
                  <Th className="text-right text-[#00ff88]">Link</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {loading && list.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#00ff88]/70">Loading…</td>
                  </tr>
                )}
                {!loading && list.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#00ff88]/70">No data</td>
                  </tr>
                )}
                {list.map((r) => {
                  const sym = r.baseToken.symbol ?? r.baseToken.address.slice(0, 6);
                  // DexScreener не всегда отдаёт 24h Δ в этом ответе — посчитаем как отсутствующую (—)
                  const price = r.priceUsd ? `$${Number(r.priceUsd).toFixed(6)}` : '—';
                  const vol = formatUsd(r.volume?.h24);
                  const liq = formatUsd(r.liquidity?.usd);
                  const fdv = r.fdv ? formatUsd(r.fdv) : '—';
                  return (
                    <tr key={r.baseToken.address} className="hover:bg-neutral-900/60">
                      <Td className="text-[#00ff88]">{sym}/{r.quoteToken.symbol ?? 'SOL'}</Td>
                      <Td right className="text-[#00ff88]">{price}</Td>
                      <Td right className="text-[#00ff88]">—</Td>
                      <Td right className="text-[#00ff88]">{vol}</Td>
                      <Td right className="text-[#00ff88]">{liq}</Td>
                      <Td right className="text-[#00ff88]">{fdv}</Td>
                      <Td right>
                        {r.url ? (
                          <a
                            className="text-[#00ff88] hover:text-[#00cc6a] underline decoration-[#00ff88]/40"
                            href={r.url}
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

          <div className="border-t border-emerald-700/20 px-4 py-2 text-xs text-neutral-400">
            Data via DexScreener • Auto refresh every 60s • Universe: tokens with symbol ending "BAGS" on Solana (best pair per token)
          </div>
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value, loading, wide }: { label: string; value: string | number; loading?: boolean; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-emerald-700/30 bg-neutral-900/60 p-5 shadow-[0_0_30px_rgba(16,185,129,0.08)] ${wide ? 'md:col-span-2' : ''}`}>
      <div className="text-xs font-medium uppercase tracking-wider text-[#00ff88]">{label}</div>
      <div className="mt-2 text-3xl font-bold text-[#00ff88] tabular-nums">
        {loading ? <span className="animate-pulse text-[#00ff88]/50">…</span> : value}
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