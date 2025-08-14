// app/whale-notifications/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';

type Row = {
  id: string;
  link: string;
  text: string;
  pubDate: string;
  ts: number;
};

export default function WhaleNotificationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/whales?limit=25`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setRows(j.list || []);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumbs />

        <header className="mb-6">
          <h1 className="text-3xl font-bold find-green-gradient mb-2">Whale Notifications</h1>
          <p className="text-[#8a8a8a]">
            Latest 25 alerts from <span className="text-green-400">@BagsWhaleBot</span>. Cleaned text, sorted by time.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={load}
              className="px-4 py-2 rounded-lg bg-green-600 text-black font-semibold hover:bg-green-500 transition-colors"
            >
              Refresh
            </button>
            {loading && <span className="text-green-300/80 text-sm">Loading…</span>}
            {error && <span className="text-red-400 text-sm">Error: {error}</span>}
          </div>
        </header>

        <section className="space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="text-green-100 leading-relaxed">{row.text}</div>
              <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                <time dateTime={new Date(row.ts).toISOString()}>
                  {new Date(row.ts).toLocaleString()}
                </time>
                <a
                  href={row.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300"
                >
                  View on X
                </a>
              </div>
            </article>
          ))}

          {!loading && !rows.length && !error && (
            <div className="text-neutral-400 text-sm">No posts found.</div>
          )}
        </section>
      </div>
    </main>
  );
}