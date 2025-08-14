// app/api/whales/route.ts
import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import he from 'he';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HANDLE  = process.env.WHALE_HANDLE  || 'BagsWhaleBot';
const LIMIT   = Number(process.env.WHALE_LIMIT || 25);
const MIRRORS = (process.env.WHALE_NITTER_MIRRORS || 
  'https://nitter.net,https://nitter.poast.org,https://nitter.fdn.fr,https://nitter.privacydev.net,https://nitter.bus-hit.me'
).split(',').map(s => s.trim()).filter(Boolean);

// Conservative cache so we don't hammer mirrors
const CACHE_HEADERS = {
  'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
};

// small timeout helper
async function fetchText(url: string, timeoutMs = 10000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: { 'accept': 'application/rss+xml, text/xml;q=0.9, */*;q=0.8' },
      signal: ctrl.signal,
      // do not cache per-request; rely on CDN/route cache headers instead
      cache: 'no-store'
    });
    if (!r.ok) throw new Error(`${r.status}`);
    const ct = r.headers.get('content-type') || '';
    // We accept xml or generic text (some mirrors mislabel)
    if (!/xml|text/i.test(ct)) {
      // still try to read; some mirrors set text/html while serving RSS
    }
    return await r.text();
  } finally {
    clearTimeout(t);
  }
}

type FeedItem = {
  id: string;
  link: string;
  text: string;
  pubDate: string;
  ts: number;
};

function parseRss(xml: string): FeedItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    trimValues: true
  });
  let j: any;
  try {
    j = parser.parse(xml);
  } catch {
    return [];
  }
  const items = j?.rss?.channel?.item || j?.feed?.entry || [];
  const arr = Array.isArray(items) ? items : [items].filter(Boolean);

  const out: FeedItem[] = [];
  for (const it of arr) {
    // Nitter usually puts text in <title>, link in <link>, and date in <pubDate>
    const rawTitle = it?.title ?? it?.description ?? it?.summary ?? '';
    const link     = typeof it?.link === 'string' ? it.link : (it?.link?.href || it?.origLink || it?.guid || '');
    const dateStr  = it?.pubDate || it?.updated || it?.published || '';

    const text = cleanTweetText(String(rawTitle || ''));
    const pub  = new Date(dateStr);
    const ts   = isFinite(pub.getTime()) ? pub.getTime() : 0;

    // build a stable id (prefer guid/link, fallback to text+date)
    const guid = String(it?.guid?.content || it?.guid || '');
    const id   = (guid || link || (text ? `${text}#${ts}` : '')).trim();
    if (!id || !text) continue;

    out.push({ id, link: String(link || ''), text, pubDate: dateStr, ts });
  }
  return out;
}

// Only strip a trailing url that mirrors append at the very end.
// Keep any urls inside the text.
function cleanTweetText(raw: string): string {
  const s = he.decode(String(raw || '').replace(/\s+/g, ' ').trim());
  // remove typical trailing " https://t.co/xxx" or mirror link at the end
  const cleaned = s.replace(/\s+(https?:\/\/(?:t\.co|x\.com|twitter\.com|nitter\.[^/\s]+)\/\S+)\s*$/i, '');
  return cleaned.trim();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || LIMIT)));

  // Aggregate from mirrors sequentially (order = priority) to avoid rate spikes.
  const all: FeedItem[] = [];
  for (const base of MIRRORS) {
    const url = `${base.replace(/\/+$/, '')}/${HANDLE}/rss`;
    try {
      const xml = await fetchText(url, 12000);
      const items = parseRss(xml);
      if (items.length) all.push(...items);
    } catch {
      // ignore mirror error, try next
    }
  }

  if (!all.length) {
    return NextResponse.json(
      { ok: false, error: 'No items from mirrors' },
      { status: 502, headers: CACHE_HEADERS }
    );
  }

  // Deduplicate by id (or link), prefer latest ts if collision
  const byId = new Map<string, FeedItem>();
  for (const it of all) {
    const k = (it.id || it.link).toLowerCase();
    const prev = byId.get(k);
    if (!prev || it.ts > prev.ts) byId.set(k, it);
  }

  // Sort desc by time and keep the last N
  const list = Array.from(byId.values())
    .filter(i => i.ts > 0)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit);

  return NextResponse.json(
    { ok: true, handle: HANDLE, count: list.length, list },
    { status: 200, headers: CACHE_HEADERS }
  );
}