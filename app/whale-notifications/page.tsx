"use client";

import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

type FeedItem = {
  id: string;
  text: string;
  url: string;
  createdAt: string;
};

const ACCOUNT = "BagsWhaleBot";
const STORAGE_KEY = "bagsfinder.whaleFeed.v1";

// Mirrors ordered by highest chance to pass CORS first.
// r.jina.ai proxies are read-only and usually set Access-Control-Allow-Origin:*.
const MIRRORS: string[] = [
  `https://nitter.poast.org/${ACCOUNT}/rss`,
  `https://nitter.net/${ACCOUNT}/rss`,
  `https://nitter.privacydev.net/${ACCOUNT}/rss`,
  `https://nitter.fdn.fr/${ACCOUNT}/rss`,
  // Proxy fallbacks
  `https://api.allorigins.win/get?url=${encodeURIComponent(`https://nitter.net/${ACCOUNT}/rss`)}`,
  `https://corsproxy.io/?${encodeURIComponent(`https://nitter.net/${ACCOUNT}/rss`)}`,
];

function stripTrailingLink(text: string) {
  // remove only a single trailing URL at the very end; keep inline links
  return text.replace(/\shttps?:\/\/\S+$/i, "").trim();
}

function toXUrl(nitterLink: string) {
  // convert nitter .../user/status/ID -> https://x.com/user/status/ID
  try {
    const u = new URL(nitterLink);
    const parts = u.pathname.split("/").filter(Boolean); // [user, "status", id]
    if (parts.length >= 3 && parts[1] === "status") {
      return `https://x.com/${parts[0]}/status/${parts[2]}`;
    }
  } catch {}
  return nitterLink;
}

function parseRss(xml: string): FeedItem[] {
  const out: FeedItem[] = [];
  
  // Handle proxy responses that wrap the RSS in JSON
  let rssContent = xml;
  try {
    const parsed = JSON.parse(xml);
    if (parsed.contents) {
      rssContent = parsed.contents;
    }
  } catch {
    // Not JSON, use as-is
  }
  
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(rssContent))) {
    const seg = m[1];
    const title = (seg.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/\r?\n/g, " ")
      .trim();
    const link = (seg.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "").trim();
    const pubDate = (seg.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "").trim();

    const id = link.match(/\/status\/(\d+)/)?.[1] || "";
    if (!id || !title) continue;

    out.push({
      id,
      text: stripTrailingLink(title),
      url: toXUrl(link),
      createdAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    });
  }

  // newest → oldest by id (BigInt-safe fallback)
  out.sort((a, b) => {
    try { return BigInt(b.id) > BigInt(a.id) ? 1 : -1; } catch { return b.id.localeCompare(a.id); }
  });
  return out;
}

async function fetchFromMirrors(): Promise<string> {
  const errors: string[] = [];
  for (const url of MIRRORS) {
    try {
      const r = await fetch(url, { 
        cache: "no-store",
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)'
        }
      });
      if (!r.ok) { errors.push(`${url}: ${r.status}`); continue; }
      const t = await r.text();
      
      // Check if it's RSS or wrapped RSS
      if (t.includes("<rss") || t.includes("<?xml") || t.includes("<feed")) {
        return t;
      }
      
      // Check if it's JSON-wrapped RSS (from proxy services)
      try {
        const parsed = JSON.parse(t);
        if (parsed.contents && (parsed.contents.includes("<rss") || parsed.contents.includes("<?xml"))) {
          return t;
        }
      } catch {}
      
      errors.push(`${url}: invalid format`);
    } catch (e: any) {
      errors.push(`${url}: ${String(e?.message || e)}`);
    }
  }
  throw new Error(errors.join(" | "));
}

function loadCache(): { items: FeedItem[]; newestId: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], newestId: "" };
    const j = JSON.parse(raw);
    const items = (j.items || []) as FeedItem[];
    // Sort items by ID (newest first)
    items.sort((a, b) => {
      try { return BigInt(b.id) > BigInt(a.id) ? 1 : -1; } catch { return b.id.localeCompare(a.id); }
    });
    return { items, newestId: j.newestId || "" };
  } catch { return { items: [], newestId: "" }; }
}

function saveCache(items: FeedItem[]) {
  if (!items.length) return;
  const newestId = items[0]?.id || "";
  try { 
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      items: items.slice(0, 100), // Keep only latest 100 posts
      newestId, 
      savedAt: Date.now() 
    })); 
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

function mergeById(existing: FeedItem[], incoming: FeedItem[]) {
  if (!incoming.length) return existing;
  
  const map = new Map(existing.map(i => [i.id, i]));
  for (const it of incoming) map.set(it.id, it);
  const all = [...map.values()];
  
  // Sort by ID (newest first)
  all.sort((a, b) => {
    try { return BigInt(b.id) > BigInt(a.id) ? 1 : -1; } catch { return b.id.localeCompare(a.id); }
  });
  
  return all.slice(0, 100); // Keep only latest 100 posts
}

export default function WhaleNotificationsPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Instant paint from cache
  useEffect(() => {
    const cached = loadCache();
    setItems(cached.items);
    // then fetch fresh
    if (cached.items.length === 0) {
      refresh(true); // Force full refresh on first visit
    } else {
      refresh(false); // Just check for new items
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh(forceFull = false) {
    setLoading(true); setError("");
    try {
      const xml = await fetchFromMirrors();
      const fetched = parseRss(xml);
      
      if (!fetched.length) {
        throw new Error("No posts found in RSS feed");
      }
      
      const cached = loadCache();
      const merged = forceFull ? fetched : mergeById(cached.items, fetched);
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