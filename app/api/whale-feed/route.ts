// app/api/whale-feed/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type FeedItem = {
  id: string;
  createdAt: string;
  text: string;
  url: string;
  image?: string;
};

const ACCOUNT = "BagsWhaleBot";

// primary and fallback sources via Jina Reader (no API key needed)
const JINA_SOURCES = [
  `https://r.jina.ai/http://x.com/${ACCOUNT}`,
  `https://r.jina.ai/http://mobile.twitter.com/${ACCOUNT}`,
  // extra fallback: rsshub mirrored through Jina (often works in previews)
  `https://r.jina.ai/http://rsshub.app/x/user/${ACCOUNT}`,
];

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function fetchText(url: string, tries = 3, timeoutMs = 15000): Promise<string> {
  let lastErr: any;
  for (let i = 0; i < tries; i++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await fetch(url, {
        signal: ctl.signal,
        headers: { "user-agent": "BagsFinder/1.0 (+https://example.org)" },
        cache: "no-store",
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(`${r.status}: ${txt.slice(0,120)}`);
      if (!txt || txt.length < 64) throw new Error("empty body");
      return txt;
    } catch (e) {
      lastErr = e;
      await sleep(250 * (i + 1) * (i + 1));
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

function extractTweetIds(source: string): string[] {
  // search everywhere for /status/<id> (10–25 digits)
  const set = new Set<string>();
  const re = /\/status\/(\d{10,25})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) set.add(m[1]);
  // newest first by BigInt
  return [...set].sort((a, b) => {
    try { return (BigInt(b) > BigInt(a)) ? 1 : -1; }
    catch { return b.localeCompare(a); }
  });
}

function stripTrailingTco(text: string): string {
  // remove only a single trailing t.co link at the very end
  return String(text || "").replace(/\s*https?:\/\/t\.co\/\S+\s*$/i, "").trim();
}

async function fetchFxTweet(id: string): Promise<FeedItem | null> {
  try {
    const r = await fetch(`https://api.fxtwitter.com/status/${id}`, { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    const t = j?.tweet;
    if (!t) return null;

    // first available media preview
    const img =
      (Array.isArray(t?.media?.photos) && t.media.photos[0]?.url) ||
      (Array.isArray(t?.media?.videos) && t.media.videos[0]?.thumbnail_url) ||
      undefined;

    return {
      id: String(t.id),
      createdAt: t.created_at ? String(t.created_at) : new Date().toISOString(),
      text: stripTrailingTco(t.text ?? ""),
      url: String(t.url ?? `https://x.com/i/web/status/${id}`),
      image: img,
    };
  } catch {
    return null;
  }
}

function newerThan(a: string, b: string) {
  if (!b) return true;
  try { return BigInt(a) > BigInt(b); } catch { return a > b; }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sinceId = (url.searchParams.get("sinceId") || "").trim();
  const max = Math.max(1, Math.min(60, parseInt(url.searchParams.get("max") || "40", 10)));

  try {
    // 1) try sources via Jina
    let page: string | null = null;
    const errs: string[] = [];
    for (const src of JINA_SOURCES) {
      try {
        page = await fetchText(src, 3, 15000);
        if (page) break;
      } catch (e: any) {
        errs.push(`${src}: ${String(e?.message || e)}`);
      }
    }
    if (!page) {
      return new Response(JSON.stringify({ ok: false, error: `All sources failed — ${errs.join(" | ")}` }), {
        status: 502, headers: { "content-type": "application/json" }
      });
    }

    // 2) collect tweet ids
    let ids = extractTweetIds(page);
    if (!ids.length) {
      return new Response(JSON.stringify({ ok: true, count: 0, latestId: sinceId || null, items: [] }), {
        headers: { "content-type": "application/json" }
      });
    }

    // 3) filter & limit
    if (sinceId) ids = ids.filter(id => newerThan(id, sinceId));
    ids = ids.slice(0, max);

    // 4) resolve details via FixTweet
    const items: FeedItem[] = [];
    for (const id of ids) {
      const it = await fetchFxTweet(id);
      if (it) items.push(it);
      await sleep(40); // tiny pacing
    }

    // sort desc just in case
    items.sort((a, b) => {
      try { return (BigInt(b.id) > BigInt(a.id)) ? 1 : -1; }
      catch { return b.id.localeCompare(a.id); }
    });

    const latestId = items[0]?.id || sinceId || null;

    return new Response(JSON.stringify({ ok: true, count: items.length, latestId, items }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "s-maxage=60, stale-while-revalidate=300"
      }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 502, headers: { "content-type": "application/json" }
    });
  }
}