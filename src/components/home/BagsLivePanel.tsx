'use client';
import { useEffect, useState } from 'react';

type Row = { mint: string; priceUsd: number; supply: number; fdv: number; volume24h: number; liquidityUsd: number; link?: string };
type Stats = { updatedAt: number; counters: { totalTokens24h: number; activeTokens: number; totalVolume24h: number; totalFdv: number; allTimeTokens: number }; list: Row[] };

export default function BagsLivePanel() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(force = false) {
    setLoading(true);
    try {
      const res = await fetch(`/api/live-bags-stats${force ? '?force=1' : ''}`, { cache: 'no-store' });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(false);
    const id = setInterval(() => load(false), 60000);
    return () => clearInterval(id);
  }, []);

  const c = data?.counters;
  const rows = data?.list || [];

  const Card = ({ title, value }: { title: string; value: string }) => (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-[0_0_40px_-20px_#00ff88]">
      <div className="text-xs uppercase tracking-widest text-white/60">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-[#00ff88]">{loading ? '…' : value}</div>
    </div>
  );

  function usd(n: number) {
    return n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(2)}K` : `$${n.toFixed(2)}`;
  }

  return (
    <section className="mt-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            <span className="text-white/70">Live </span><span className="text-[#00ff88]">BAGS</span> Markets
          </h2>
          <button onClick={() => load(true)} className="rounded-xl bg-[#00ff88]/10 px-4 py-2 text-sm text-[#00ff88] hover:bg-[#00ff88]/20">
            Refresh
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card title="Total tokens (24h)" value={`${c?.totalTokens24h ?? 0}`} />
          <Card title="Active tokens" value={`${c?.activeTokens ?? 0}`} />
          <Card title="24h volume" value={usd(c?.totalVolume24h ?? 0)} />
          <Card title="Total FDV" value={usd(c?.totalFdv ?? 0)} />
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="mb-3 text-sm font-medium uppercase tracking-widest text-white/60">Top markets by FDV (created via Bags)</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-white/50">
                <tr className="[&>th]:px-3 [&>th]:py-2">
                  <th className="text-left">Pair</th>
                  <th className="text-right">Price (USD)</th>
                  <th className="text-right">24h Δ</th>
                  <th className="text-right">24h Vol</th>
                  <th className="text-right">Liquidity</th>
                  <th className="text-right">FDV</th>
                  <th className="text-right">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading && rows.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-6 text-white/40">Loading…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-6 text-white/40">No markets found.</td></tr>
                ) : rows.map(r => (
                  <tr key={r.mint} className="[&>td]:px-3 [&>td]:py-2">
                    <td className="text-white/90">{r.mint.slice(0,4)}…{r.mint.slice(-4)}/SOL</td>
                    <td className="text-right text-white/90">{r.priceUsd ? `$${r.priceUsd.toFixed(6)}` : '—'}</td>
                    <td className="text-right text-white/60">—</td>
                    <td className="text-right text-white/90">{usd(r.volume24h)}</td>
                    <td className="text-right text-white/90">{usd(r.liquidityUsd)}</td>
                    <td className="text-right text-[#00ff88] font-medium">{usd(r.fdv)}</td>
                    <td className="text-right">
                      {r.link ? <a href={r.link} target="_blank" className="rounded bg-[#00ff88]/10 px-2 py-1 text-[#00ff88] hover:bg-[#00ff88]/20">Dexscreener</a> : <span className="text-white/40">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-white/40">Data via Helius + Jupiter (fallback Dexscreener) • Auto-refresh every 60s • Program-based discovery</div>
        </div>
      </div>
    </section>
  );
}