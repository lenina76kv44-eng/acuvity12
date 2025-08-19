"use client";
import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

export default function WhaleNotificationsPage() {
  const [items, setItems] = useState<Array<{ id: string; url: string; text: string; createdAt: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/whales/bot?handle=BagsWhaleBot&limit=25', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setItems(j.list || []);
    } catch (e: any) {
      console.error('Whale feed error:', e);
      setError('Failed to load whale feed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs />

        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2 find-green-gradient">Whale notifications</h1>
          <p className="text-[#8A8A8A]">
            Live feed from <span className="text-[#7AEFB8] font-semibold">@BagsWhaleBot</span>. Latest 25 posts. No links at the end.
          </p>
        </header>

        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => refresh()}
            className="rounded-xl bg-green-600 text-black px-5 py-2 font-semibold hover:bg-green-500 active:bg-green-600 disabled:opacity-50 shadow-[0_0_0_1px_rgba(0,255,136,.2)] transition-all"
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          {loading && (
            <div className="flex items-center text-green-300/80 text-sm">
              <div className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full mr-2"></div>
              Loading feed…
            </div>
          )}
          {error && <div className="text-red-400 text-sm">{error}</div>}
        </div>

        <div className="space-y-3">
          {items.map((it) => (
            <article key={it.id} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-[0_0_0_1px_rgba(16,185,129,0.06)] hover:shadow-[0_6px_30px_rgba(16,185,129,.08)] transition-all">
              <div className="flex items-center justify-between mb-2">
                <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-300/80 hover:text-green-200">
                  {it.url.replace(/^https?:\/\//, "")}
                </a>
                <div className="text-xs text-neutral-400">
                  {it.createdAt ? new Date(it.createdAt).toLocaleDateString() : ''}
                </div>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-green-50">{it.text}</p>
            </article>
          ))}

          {!loading && !error && items.length === 0 && (
            <div className="text-neutral-400 text-sm">
              No posts found yet. Try Refresh.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}