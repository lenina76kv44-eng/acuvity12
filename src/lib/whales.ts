const UA = 'Mozilla/5.0 (BagsFinder/1.0; +https://your-domain.example)';

const NITTER_MIRRORS = [
  'https://nitter.net',
  'https://nitter.poast.org',
  'https://nitter.privacydev.net',
  'https://nitter.fdn.fr',
  'https://nitter.bus-hit.me',
];

function uniq<T>(arr: T[]) { return [...new Set(arr)]; }

async function fetchText(url: string, timeoutMs = 10000): Promise<string> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA }, signal: ctrl.signal });
    // We intentionally do NOT require JSON here: sources often return text/html or xml
    return await r.text();
  } finally {
    clearTimeout(id);
  }
}

/** Extract /status/<id> from any text blob */
function extractStatusIds(raw: string, max = 100): string[] {
  const ids = [...raw.matchAll(/(?:\/|status%2F)status\/(\d{10,})/g)].map(m => m[1]);
  const idsAlt = [...raw.matchAll(/\/status%2F(\d{10,})/g)].map(m => m[1]);
  const all = uniq([...ids, ...idsAlt]);
  return all.slice(0, max);
}

/** Try to get latest IDs from Nitter RSS mirrors */
export async function fetchNitterIds(handle: string, max = 60): Promise<string[]> {
  for (const base of NITTER_MIRRORS) {
    try {
      const rssUrl = `${base.replace(/\/+$/, '')}/${encodeURIComponent(handle)}/rss`;
      const raw = await fetchText(rssUrl, 9000);
      // RSS may have <link>…/status/<id> — simple regex is enough
      const ids = uniq([
        ...[...raw.matchAll(/\/status\/(\d{10,})</g)].map(m => m[1]),
        ...[...raw.matchAll(/\/status%2F(\d{10,})/g)].map(m => m[1]),
      ]);
      if (ids.length) return ids.slice(0, max);
    } catch {
      // try next mirror
    }
  }
  return [];
}

/** Fallback: parse public X page via Jina text reader and extract /status/<id> */
export async function fetchJinaIds(handle: string, max = 60): Promise<string[]> {
  try {
    const url = `https://r.jina.ai/http://x.com/${encodeURIComponent(handle)}`;
    const raw = await fetchText(url, 10000);
    return extractStatusIds(raw, max);
  } catch {
    return [];
  }
}

/** Fetch clean tweet data from FixTweet (no key required) */
export async function fetchFixTweet(id: string): Promise<{
  id: string; url: string; text: string; created_timestamp: number;
  author?: { screen_name?: string }
}> {
  const url = `https://api.fxtwitter.com/status/${id}`;
  const raw = await fetchText(url, 10000);
  const j = JSON.parse(raw);
  if (!j?.tweet) throw new Error('FixTweet: no tweet');
  return j.tweet;
}

/** Remove trailing single URL (bags link/t.co) but keep inline links */
export function stripTrailingUrl(text: string): string {
  return (text || '').replace(/\shttps?:\/\/\S+$/i, '').trim();
}

export async function getLatestTweets(handle: string, limit = 25) {
  let ids = await fetchNitterIds(handle, limit * 3);
  if (ids.length < limit) {
    const more = await fetchJinaIds(handle, limit * 4);
    ids = uniq([...ids, ...more]);
  }
  if (!ids.length) throw new Error('No tweet IDs from mirrors');

  // fetch details; prefer newest first by ID (Snowflake grows over time)
  ids.sort((a, b) => Number(b) - Number(a));

  const out: Array<{ id: string; url: string; text: string; createdAt: number }> = [];
  for (const id of ids.slice(0, limit * 2)) {
    try {
      const t = await fetchFixTweet(id);
      const author = t?.author?.screen_name || '';
      if (author.toLowerCase() !== handle.toLowerCase()) continue; // safety
      out.push({
        id: t.id,
        url: t.url,
        text: stripTrailingUrl(t.text),
        createdAt: (t.created_timestamp || 0) * 1000,
      });
      if (out.length >= limit) break;
    } catch {
      // skip bad id
    }
  }

  // final sort by createdAt desc and return exactly `limit`
  out.sort((a, b) => b.createdAt - a.createdAt);
  return out.slice(0, limit);
}