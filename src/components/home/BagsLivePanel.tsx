'use client';
import { useEffect, useState } from 'react';

type Metrics = {
  updatedAt: number;
  demo?: boolean;
  totals: {
    tokensAllTime: number;
    tokens24h: number;
    vol24hUsd: number;
    liquidityUsd: number;
  };
};

function fmtUsd(n?: number) {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return `$${(n/1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `$${(n/1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `$${(n/1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function Card({title, value}:{title:string; value:React.ReactNode}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0f0a] p-5 shadow-[0_0_60px_rgba(0,255,136,0.05)]">
      <div className="text-xs uppercase tracking-widest text-[#00ff88]/80 mb-3">{title}</div>
      <div className="text-4xl font-bold text-[#00ff88]">{value}</div>
    </div>
  );
}

export default function BagsLivePanel() {
  const [data, setData] = useState<Metrics|null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(first=false) {
    try {
      if (!first) setRefreshing(true);
      const res = await fetch('/api/bags/metrics', { cache: 'no-store' });
      const json = await res.json();
      setData(json);
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

  const sk = <div className="h-8 w-24 animate-pulse rounded-md bg-white/10" />;

  return (
    <section className="mt-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            <span className="text-white">Live </span>
            <span className="text-[#00ff88]">BAGS</span>
            <span className="text-white"> Markets</span>
          </h2>
          <div className="flex items-center gap-3">
            {data?.demo && (
              <span className="rounded-md border border-[#00ff88]/40 bg-[#00ff88]/10 px-2 py-1 text-xs text-[#00ff88]">
                Demo data
              </span>
            )}
            <button
              onClick={() => load()}
              className="rounded-lg bg-[#00ff88]/20 px-4 py-2 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/30 transition"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* 4 KPI */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Total Tokens (All-time)" value={loading ? sk : (data?.totals.tokensAllTime ?? 0)} />
          <Card title="Tokens (24h)"          value={loading ? sk : (data?.totals.tokens24h ?? 0)} />
          <Card title="24h Volume"            value={loading ? sk : fmtUsd(data?.totals.vol24hUsd)} />
          <Card title="Total Liquidity"       value={loading ? sk : fmtUsd(data?.totals.liquidityUsd)} />
        </div>

        {/* Таблицу полностью удаляем */}
        <div className="mt-6 text-xs text-white/40">
          Data mode: {data?.demo ? 'Synthetic (demo)' : 'Live'}
        </div>
      </div>
    </section>
  );
}