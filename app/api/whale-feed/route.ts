import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type FeedItem = {
  id: string;
  url: string;
  text: string;
  time?: string;
};

const JINA = (u: string) => `https://r.jina.ai/${u.replace(/^https?:\/\//, "")}`;
const PROFILE_URL = (handle: string) => `http://x.com/${handle}`;
const STATUS_URL = (id: string) => `http://x.com/i/status/${id}`;

const TCO_TRAIL = /\shttps?:\/\/t\.co\/[A-Za-z0-9]+$/;
const STATUS_ID_RE = /\/status\/(\d{10,30})/g;

const memCache: Record<string, { at: number; items: FeedItem[] }> = {};
const TTL_MS = 5 * 60 * 1000;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchTextWithRetry(url: string, tries = 3, timeoutMs = 15000): Promise<string> {
  let lastErr: any;
  for (let i = 1; i <= tries; i++) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { headers: { "accept": "text/plain" }, signal: ctrl.signal });
      clearTimeout(to);
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      const txt = await r.text();
      // Jina returns plain text/markdown; guard against HTML
      if (/<!doctype html>/i.test(txt) || /<html/i.test(txt)) {
        throw new Error("bad-format-html");
      }
      return txt;
    } catch (e: any) {
      clearTimeout(to);
      lastErr = e;
      // small backoff
      await sleep(200 * i);
      continue;
    }
  }
  throw lastErr ?? new Error("fetch-failed");
}

function uniq<T>(arr: T[]): T[] {
  const s = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    const k = JSON.stringify(x);
    if (!s.has(k)) { s.add(k); out.push(x); }
  }
  return out;
}

function extractStatusIds(profileText: string, max = 60): string[] {
  const ids = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = STATUS_ID_RE.exec(profileText)) && ids.size < max) {
    ids.add(m[1]);
  }
  // also try "status/ID?…" occurrences
  return Array.from(ids);
}

function cleanTweetText(raw: string): string {
  let t = raw
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^Replying to.*\n?/im, "")   // drop reply headers if present
    .trim();
  // take content before author line like "— BagsWhaleBot (@BagsWhaleBot) …"
  const cut = t.split(/\n—\s*@?BagsWhaleBot|\n—\s*BagsWhaleBot/i)[0]?.trim();
  if (cut) t = cut;
  t = t.replace(TCO_TRAIL, "").trim();
  return t;
}

function parseStatusPage(txt: string): { text: string; time?: string } {
  // Heuristic: first block of text before author line is the tweet body.
  const text = cleanTweetText(txt);
  // Find a date-like stamp in the doc to show to user (optional)
  const timeMatch = txt.match(/[A-Z][a-z]{2,9}\s+\d{1,2},\s+\d{4}[^ \n]*/); // e.g. Aug 2, 2025 · 10:33 PM UTC
  return { text, time: timeMatch?.[0] };
}

async function buildFeed(handle: string, limit: number): Promise<FeedItem[]> {
  // 1) fetch profile via Jina
  const profileTxt = await fetchTextWithRetry(JINA(PROFILE_URL(handle)));

  // 2) collect up to ~60 recent status IDs from the profile text
  const ids = extractStatusIds(profileTxt, Math.max(limit, 50));
  if (!ids.length) return [];

  // 3) fetch each status page, parse text
  const items: FeedItem[] = [];
  const concurrency = 5;
  let idx = 0;

  async function worker() {
    while (idx < ids.length) {
      const i = idx++;
      const id = ids[i];
      try {
        const txt = await fetchTextWithRetry(JINA(STATUS_URL(id)), 3, 15000);
        const parsed = parseStatusPage(txt);
        if (parsed.text) {
          items.push({
            id,
            url: `https://x.com/i/status/${id}`,
            text: parsed.text,
            time: parsed.time,
          });
        }
      } catch {
        // ignore single status failure
      }
      // be gentle
      await sleep(80);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  // 4) normalize, sort by id desc (tweet ids are time-ordered), cut to limit
  const unique = uniq(
    items
      .filter(x => x.text && x.text.length > 1)
      .map(x => ({ ...x, text: x.text.trim() }))
  );

  unique.sort((a, b) => (b.id.localeCompare(a.id)));
  return unique.slice(0, limit);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const handle = (url.searchParams.get("handle") || "BagsWhaleBot").replace(/^@/, "");
    const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get("limit") || "25", 10)));
    const force = url.searchParams.get("refresh") === "1";
    const cacheKey = `${handle}:${limit}`;

    const now = Date.now();
    if (!force && memCache[cacheKey] && now - memCache[cacheKey].at < TTL_MS) {
      return new Response(JSON.stringify({ ok: true, handle, cached: true, items: memCache[cacheKey].items }), {
        headers: { "content-type": "application/json" },
      });
    }

    const items = await buildFeed(handle, limit);
    memCache[cacheKey] = { at: now, items };

    return new Response(JSON.stringify({ ok: true, handle, cached: false, items }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    const msg = e?.message || String(e);
    return new Response(JSON.stringify({ ok: false, error: `Whale feed failed: ${msg}` }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}