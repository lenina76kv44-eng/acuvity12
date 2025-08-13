"use client";

import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

type FeedItem = { id: string; text: string; url: string; createdAt: string; };
type ApiResp = { ok: boolean; items: FeedItem[]; newestId: string | null; count: number };

const STORAGE_KEY = "bagsfinder.whaleFeed.v1";

function loadCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] as FeedItem[], newestId: "" };
    const j = JSON.parse(raw);
    return { items: (j.items || []) as FeedItem[], newestId: j.newestId || "" };
  } catch { return { items: [] as FeedItem[], newestId: "" }; }
}

function saveCache(items: FeedItem[]) {
  try { 
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      items: items.slice(0, 100), // Keep only latest 100 posts
      newestId: items[0]?.id || "", 
      savedAt: Date.now() 
    })); 
  } catch {}
}

function mergeById(a: FeedItem[], b: FeedItem[]) {
  const map = new Map(a.map(x => [x.id, x]));
  for (const it of b) map.set(it.id, it);
  const all = [...map.values()];
  all.sort((x, y) => {
    try { return (BigInt(y.id) > BigInt(x.id)) ? 1 : -1; }
    catch { return y.id.localeCompare(x.id); }
  });
  return all.slice(0, 100); // Keep only latest 100 posts
}

export default function WhaleNotificationsPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cached = loadCache();
    setItems(cached.items);
    // Auto-refresh on first load
    if (cached.items.length === 0) {
      refresh(true); // Force full refresh on first visit
    } else {
      refresh(false); // Just check for new items
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh(forceFull = false) {
    setLoading(true); 
    setError("");
    try {
      const cached = loadCache();
      const newestId = forceFull ? "" : (cached.newestId || cached.items[0]?.id || "");
      const qs = newestId ? `?since_id=${encodeURIComponent(newestId)}&max=120` : `?max=120`;
      
      const r = await fetch(`/api/whale-feed${qs}`, { cache: "no-store" });
      const j: ApiResp = await r.json();
      
      if (!r.ok || !j?.ok) {
        throw new Error((j as any)?.error || "Fetch failed");
      }
      
      const merged = forceFull ? j.items : mergeById(cached.items, j.items);
      setItems(merged);
      saveCache(merged);
      
      if (!forceFull && merged.length > cached.items.length) {
        console.log(`Found ${merged.length - cached.items.length} new posts`);
      }
    } catch (e: any) {
      const errorMsg = e?.message || "Failed to load whale feed";
      setError(errorMsg);
      console.error('Whale feed error:', errorMsg);
    } finally {
      setLoading(false);
    }
  }

  const copy = (v: string) => navigator.clipboard?.writeText(v).catch(() => {});

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumbs />
        <header className="mb-6">
          <div className="text-xs uppercase tracking-wide text-[#7AEFB8] mb-1 font-semibold">Signals — X</div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 find-green-gradient">Whale Notifications</h1>
          <p className="text-[#8A8A8A] text-sm">
            Fresh @BagsWhaleBot alerts. We strip only the trailing link — raw signal, no fluff.
          </p>
          <div className="mt-4 flex gap-3 items-center">
            <button
              onClick={() => refresh(false)}
              disabled={loading}
              className="rounded-xl bg-green-600 text-black px-5 py-2.5 font-semibold hover:bg-green-500 active:bg-green-600 disabled:opacity-60 shadow-[0_0_0_1px_rgba(0,255,136,.2)] hover:shadow-[0_10px_30px_rgba(0,255,136,.15)] transition-all duration-200 btn-animated"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  <span>Finding<span className="animate-loading-dots"></span></span>
                </div>
              ) : "Find new"}
            </button>
            <button
              onClick={() => refresh(true)}
              disabled={loading}
              className="rounded-xl bg-neutral-900 border border-neutral-800 text-green-200 px-5 py-2.5 font-semibold hover:bg-neutral-800 btn-animated"
            >
              Reload full
            </button>
            {error && <span className="text-red-400 text-sm animate-bounce-in">{error}</span>}
          </div>
        </header>

        <section className="space-y-3">
          {items.map((it, index) => (
            <article key={it.id} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 find-glow card-hover animate-scale-in" style={{animationDelay: `${index * 0.05}s`}}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 flex items-center justify-center text-[#7AEFB8] font-bold floating-element">W</div>
                <div className="flex-1 min-w-0">
                  <div className="text-green-100 whitespace-pre-wrap break-words">{it.text}</div>
                  <div className="text-xs text-neutral-500 mt-2">
                    {new Date(it.createdAt).toLocaleString()} • ID {it.id}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-green-200 transition-all duration-200 hover:scale-105 btn-animated"
                  >
                    Open on X
                  </a>
                  <button
                    onClick={() => copy(it.id)}
                    className="text-xs px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-green-200 transition-all duration-200 hover:scale-105 btn-animated"
                  >
                    Copy ID
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!loading && items.length === 0 && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-neutral-400 animate-fade-in">
              No posts yet. Click "Find new".
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 animate-pulse text-neutral-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></div>
                <span>Loading whale posts<span className="animate-loading-dots"></span></span>
              </div>
            </div>
          )}
        </section>

        <footer className="mt-10 text-xs text-neutral-500">
          Source mirrored via public Nitter instances. Content © their respective owners.
        </footer>
      </div>
    </main>
  );
}