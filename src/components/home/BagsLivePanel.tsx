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
    <div className="rounded-2xl border border-[#0E983B]/20 bg-gradient-to-br from-black/90 to-[#0a0a0a] p-5 shadow-[0_0_40px_rgba(14,152,59,0.15)] hover:shadow-[0_0_60px_rgba(14,152,59,0.25)] transition-all duration-300">
      <div className="text-xs uppercase tracking-widest text-[#0E983B]/90 mb-3 font-semibold">{title}</div>
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

  const sk = <div className="h-8 w-24 animate-pulse rounded-md bg-[#0E983B]/20" />;

  return (
    <section className="mt-16">
      <div className="mx-auto max-w-7xl px-4 relative">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            <span className="text-white/90">Live </span>
            <span className="text-[#00ff88]">BAGS</span>
            <span className="text-white/90"> Markets</span>
          </h2>
          <div className="flex items-center gap-3">
            {data?.demo && (
              <span className="rounded-lg border border-[#0E983B]/50 bg-[#0E983B]/15 px-3 py-1.5 text-xs font-semibold text-[#0E983B] shadow-lg">
                Demo data
              </span>
            )}
            <button
              onClick={() => load()}
              className="rounded-lg bg-[#0E983B]/20 border border-[#0E983B]/30 px-4 py-2 text-sm font-semibold text-[#0E983B] hover:bg-[#0E983B]/30 hover:border-[#0E983B]/50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* 4 KPI */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card title="Total Tokens (All-time)" value={loading ? sk : (data?.totals.tokensAllTime ?? 0)} />
          <Card title="Tokens (24h)"          value={loading ? sk : (data?.totals.tokens24h ?? 0)} />
          <Card title="24h Volume"            value={loading ? sk : fmtUsd(data?.totals.vol24hUsd)} />
          <Card title="Total Liquidity"       value={loading ? sk : fmtUsd(data?.totals.liquidityUsd)} />
        </div>

        {/* Таблицу полностью удаляем */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 border border-[#0E983B]/20">
            <div className={`w-2 h-2 rounded-full ${data?.demo ? 'bg-[#0E983B] animate-pulse' : 'bg-green-400'}`}></div>
            <span className="text-xs font-medium text-[#0E983B]/80">
              {data?.demo ? 'Demo Mode Active' : 'Live Data'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}