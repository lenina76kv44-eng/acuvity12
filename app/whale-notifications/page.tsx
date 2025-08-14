// app/whale-notifications/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  text: string;
  created_at?: string;
  created_timestamp?: number;
  url?: string;
  media?: { photos: string[]; videos: string[] };
  author?: { name?: string; handle?: string; avatar?: string };
};

export default function WhaleNotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let gone = false;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch("/api/whale-feed", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok || !j?.ok) throw new Error(j?.error || "Failed");
        if (!gone) setItems(j.items || []);
      } catch (e: any) {
        if (!gone) setErr(String(e?.message || e));
      } finally {
        if (!gone) setLoading(false);
      }
    }
    load();
    return () => { gone = true; };
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-6">
      <div className="max-w-5xl mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Whale Notifications</h1>
          <p className="text-neutral-400">Live feed from @{process.env.NEXT_PUBLIC_WHALE_USER || "BagsWhaleBot"} — last 25 posts. Clean text, no trailing links.</p>
        </header>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-[#7AEFB8] font-semibold">Feed</div>
            <button
              onClick={() => location.reload()}
              className="px-3 py-1 rounded-lg bg-green-600 text-black text-xs font-semibold hover:bg-green-500"
            >
              Refresh
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-green-300">
              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              Loading…
            </div>
          )}

          {err && !loading && (
            <div className="text-red-400 text-sm">Error: {err}</div>
          )}

          {!loading && !err && (
            <ul className="space-y-4">
              {items.map((it) => (
                <li key={it.id} className="p-4 rounded-xl bg-black/50 border border-neutral-800">
                  <div className="flex items-start gap-3">
                    {it.author?.avatar ? (
                      <img src={it.author.avatar} alt="" className="w-10 h-10 rounded-lg border border-neutral-700 object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg border border-neutral-700 bg-neutral-800" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-neutral-300">
                        <span className="font-semibold text-white">{it.author?.name || "Whale Bot"}</span>{" "}
                        <span className="text-neutral-500">@{it.author?.handle || "BagsWhaleBot"}</span>
                        {it.created_at && <span className="text-neutral-600"> • {new Date(it.created_at).toLocaleString()}</span>}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-green-100">{it.text}</div>

                      {(it.media?.photos?.length ?? 0) > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {it.media!.photos!.slice(0, 4).map((src, i) => (
                            <img key={i} src={src} alt="" className="w-full rounded-lg border border-neutral-800" />
                          ))}
                        </div>
                      )}
                      {(it.media?.videos?.length ?? 0) > 0 && (
                        <div className="mt-3">
                          {/* show first MP4 as a link; we avoid autoplay in list */}
                          <a href={it.media!.videos![0]} target="_blank" className="text-xs text-green-400 underline">Open video</a>
                        </div>
                      )}
                    </div>

                    {it.url && (
                      <Link
                        href={it.url}
                        target="_blank"
                        className="px-3 py-1 bg-green-600 hover:bg-green-500 text-black text-xs font-semibold rounded-lg"
                      >
                        Open
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && !err && items.length === 0 && (
            <div className="text-neutral-400 text-sm">No posts yet.</div>
          )}
        </div>
      </div>
    </main>
  );
}