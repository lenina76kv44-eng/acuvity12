"use client";

import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

type Item = { id: string; createdAt: string; text: string; url: string; image?: string };
type ApiResp = { ok: boolean; count: number; latestId: string | null; items: Item[] };

const CACHE_KEY = "whale:cache.v1";      // stores items[]
const LAST_SEEN_KEY = "whale:lastSeenId"; // stores latestId

function loadCache(): { items: Item[]; latestId: string } {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { items: [], latestId: "" };
    const j = JSON.parse(raw);
    return { items: Array.isArray(j.items) ? j.items : [], latestId: String(j.latestId || "") };
  } catch {
    return { items: [], latestId: "" };
  }
}
function saveCache(items: Item[], latestId: string) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ items, latestId, ts: Date.now() })); } catch {}
  try { if (latestId) localStorage.setItem(LAST_SEEN_KEY, latestId); } catch {}
}
function mergeById(existing: Item[], incoming: Item[]) {
  const map = new Map(existing.map(x => [x.id, x]));
  for (const it of incoming) map.set(it.id, it);
  const all = [...map.values()];
  all.sort((a,b) => {
    try { return (BigInt(b.id) > BigInt(a.id)) ? 1 : -1; }
    catch { return b.id.localeCompare(a.id); }
  });
  return all;
}

export default function WhaleNotificationsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const cached = loadCache();
    setItems(cached.items);
    void refresh(true);
  }, []);

  async function refresh(initial = false) {
    setLoading(true); setErr("");
    try {
      const sinceId = initial ? (localStorage.getItem(LAST_SEEN_KEY) || "") : (localStorage.getItem(LAST_SEEN_KEY) || items[0]?.id || "");
      const u = new URL("/api/whale-feed", window.location.origin);
      if (sinceId) u.searchParams.set("sinceId", sinceId);
      const r = await fetch(u.toString(), { cache: "no-store" });
      const j: ApiResp = await r.json();
      if (!r.ok || !j?.ok) throw new Error((j as any)?.error || "Fetch failed");

      const merged = sinceId ? mergeById(items, j.items) : j.items;
      setItems(merged);
      const latestId = j.latestId || merged[0]?.id || sinceId || "";
      saveCache(merged, latestId);
    } catch (e: any) {
      setErr(String(e?.message || e));
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
            Live feed from <span className="text-[#7AEFB8]">@BagsWhaleBot</span>.
          </p>
          <div className="mt-4 flex gap-3 items-center">
            <button
              onClick={() => { localStorage.removeItem(LAST_SEEN_KEY); refresh(true); }}
              disabled={loading}
              className="rounded-xl bg-neutral-900 border border-neutral-800 text-green-200 px-5 py-2.5 font-semibold hover:bg-neutral-800"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            {err && <span className="text-red-400 text-sm">{err}</span>}
          </div>
        </header>

        <section className="space-y-3">
          {items.length === 0 && !loading && !err && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-neutral-400">
              No posts yet. Click "Find new".
            </div>
          )}

          {items.map((it) => (
            <article key={it.id} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 find-glow find-hover">
              <div className="flex items-start gap-4">
                {it.image ? (
                  <img src={it.image} alt="" className="w-16 h-16 rounded-lg object-cover border border-neutral-800" />
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-neutral-800 bg-neutral-900" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-neutral-500 mb-2">
                    {new Date(it.createdAt).toLocaleString()} • ID {it.id}
                  </div>
                  <div className="text-green-100 whitespace-pre-wrap break-words">{it.text || "(no text)"}</div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => copy(it.url)}
                      className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-green-200 text-xs font-medium rounded-lg"
                    >
                      Copy link
                    </button>
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-green-600 hover:bg-green-500 text-black text-xs font-semibold rounded-lg"
                    >
                      Open on X
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {loading && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 animate-pulse text-neutral-400">
              Loading whale posts…
            </div>
          )}
        </section>

        <footer className="mt-10 text-xs text-neutral-500">
          Source via Jina Reader & FixTweet. Content © respective owners.
        </footer>
      </div>
    </main>
  );
}