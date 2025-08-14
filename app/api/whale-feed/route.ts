// app/api/whale-feed/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const USER = process.env.WHALE_USER || "BagsWhaleBot";
const FX_API = process.env.FXTWITTER_API_BASE || "https://api.fxtwitter.com";
const MIRRORS = ["fxtwitter.com", "vxtwitter.com", "fixupx.com", "twittpr.com"]; // common FixTweet mirrors
const MAX = 25;

// simple in-memory cache (per lambda/process)
type Item = {
  id: string;
  text: string;
  created_at?: string;
  created_timestamp?: number;
  url?: string;
  media?: { photos: string[]; videos: string[] };
  author?: { name?: string; handle?: string; avatar?: string };
};
let CACHE: { ts: number; items: Item[] } = { ts: 0, items: [] };
const TTL = 60 * 1000; // 60s

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}
function cleanText(s: string) {
  // remove trailing t.co links + collapse spaces
  return (s || "").replace(/https?:\/\/t\.co\/\S+/g, "").replace(/\s+/g, " ").trim();
}
async function fetchText(url: string) {
  const r = await fetch(url, {
    headers: { accept: "text/plain" },
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.text();
}

export async function GET() {
  try {
    if (Date.now() - CACHE.ts < TTL && CACHE.items.length) {
      return NextResponse.json({ ok: true, cached: true, count: CACHE.items.length, items: CACHE.items.slice(0, MAX) });
    }

    const errors: string[] = [];
    // 1) scrape a readable version of the FixTweet user page to find status IDs
    let raw = "";
    let rawIds: string[] = [];
    
    // Try Jina Reader first with HTTPS
    for (const host of MIRRORS) {
      try {
        // Try Jina Reader with HTTPS
        const url = `https://r.jina.ai/https://${host}/${USER}`;
        const txt = await fetchText(url);
        if (txt && txt.length > 400) { raw = txt; break; }
        errors.push(`${host} (jina): empty`);
      } catch (e: any) {
        errors.push(`${host} (jina): ${String(e?.message || e)}`);
      }
    }
    
    // If Jina Reader failed, try direct access (this might have CORS issues but worth trying)
    if (!raw) {
      for (const host of MIRRORS) {
        try {
          const url = `https://${host}/${USER}`;
          const response = await fetch(url, {
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            cache: "no-store"
          });
          if (response.ok) {
            const html = await response.text();
            if (html && html.length > 400) { raw = html; break; }
          }
          errors.push(`${host} (direct): ${response.status}`);
        } catch (e: any) {
          errors.push(`${host} (direct): ${String(e?.message || e)}`);
        }
      }
    }
    
    if (!raw) {
      return NextResponse.json({ ok: false, error: `No markup from mirrors: ${errors.join(" | ")}` }, { status: 502 });
    }

    // 2) extract tweet IDs - try multiple patterns
    const statusMatches = [...raw.matchAll(/\/status\/(\d{10,})/g)].map(m => m[1]);
    const tweetMatches = [...raw.matchAll(/\/tweet\/(\d{10,})/g)].map(m => m[1]);
    const idMatches = [...raw.matchAll(/"id"\s*:\s*"(\d{10,})"/g)].map(m => m[1]);
    
    const ids = uniq([...statusMatches, ...tweetMatches, ...idMatches]).slice(0, 100);
    if (!ids.length) {
      return NextResponse.json({ ok: false, error: "No status ids found in user page" }, { status: 502 });
    }

    // 3) hydrate IDs via FixTweet JSON API (concurrency-limited)
    const items: Item[] = [];
    const pool = 6;
    let idx = 0;

    async function worker() {
      while (idx < ids.length && items.length < MAX) {
        const id = ids[idx++];
        const url = `${FX_API}/${USER}/status/${id}`;
        try {
          const r = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store", next: { revalidate: 0 } });
          if (!r.ok) { errors.push(`${id}: ${r.status}`); continue; }
          const j = await r.json();
          const t = j?.tweet;
          if (t) {
            items.push({
              id: t.id,
              text: cleanText(t.text || ""),
              created_at: t.created_at,
              created_timestamp: t.created_timestamp,
              url: t.url,
              media: {
                photos: (t.media?.photos || []).map((p: any) => p.url),
                videos: (t.media?.videos || []).map((v: any) => v.url),
              },
              author: {
                name: t.author?.name,
                handle: t.author?.screen_name,
                avatar: t.author?.avatar_url,
              },
            });
          }
        } catch (e: any) {
          errors.push(`${id}: ${String(e?.message || e)}`);
        }
      }
    }
    await Promise.all(Array.from({ length: pool }, worker));

    // 4) sort desc by created_timestamp and cap
    items.sort((a, b) => (b.created_timestamp || 0) - (a.created_timestamp || 0));
    const out = items.slice(0, MAX);

    if (!out.length) {
      return NextResponse.json({ ok: false, error: `FixTweet returned 0 items; errors: ${errors.join(" | ")}` }, { status: 502 });
    }

    CACHE = { ts: Date.now(), items: out };
    return NextResponse.json({ ok: true, count: out.length, items: out, errors }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}