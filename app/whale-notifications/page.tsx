"use client";
import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

type Item = { id: string; url: string; text: string; time?: string };

function useWhaleFeed(handle = "BagsWhaleBot", limit = 25) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const load = async (refresh = false) => {
    setLoading(true); setErr("");
    try {
      const u = new URL("/api/whale-feed", window.location.origin);
      u.searchParams.set("handle", handle);
      u.searchParams.set("limit", String(limit));
      if (refresh) u.searchParams.set("refresh", "1");
      const r = await fetch(u.toString(), { headers: { accept: "application/json" } });
      const raw = await r.text();
      let j: any;
      try { j = JSON.parse(raw); }
      catch { throw new Error(`Invalid JSON from API (${raw.slice(0,120)})`); }

      if (!j.ok) throw new Error(j.error || "Feed failed");
      setItems(Array.isArray(j.items) ? j.items : []);
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, err, load };
}

export default function WhaleNotificationsPage() {
  const { items, loading, err, load } = useWhaleFeed("BagsWhaleBot", 25);

  useEffect(() => { load(false); }, []);

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
            onClick={() => load(true)}
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
          {err && <div className="text-red-400 text-sm">{err}</div>}
        </div>

        <div className="space-y-3">
          {items.map((it) => (
            <article key={it.id} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-[0_0_0_1px_rgba(16,185,129,0.06)] hover:shadow-[0_6px_30px_rgba(16,185,129,.08)] transition-all">
              <div className="flex items-center justify-between mb-2">
                <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-300/80 hover:text-green-200">
                  {it.url.replace(/^https?:\/\//, "")}
                </a>
                {it.time && <div className="text-xs text-neutral-400">{it.time}</div>}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-green-50">{it.text}</p>
            </article>
          ))}

          {!loading && !err && items.length === 0 && (
            <div className="text-neutral-400 text-sm">
              No posts found yet. Try Refresh.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}