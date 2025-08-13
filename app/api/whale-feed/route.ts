export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type FeedItem = {
  id: string;
  text: string;      // trailing link removed
  url: string;       // https://x.com/.../status/ID
  createdAt: string; // ISO
};

const ACCOUNT = "BagsWhaleBot";

// You can override via env NITTER_HOSTS (comma-separated) if needed.
// By default we try several mirrors.
function getMirrors(): string[] {
  const envList = (process.env.NITTER_HOSTS || "").trim();
  if (envList) return envList.split(",").map(s => s.trim()).filter(Boolean);
  return [
    "https://nitter.net",
    "https://nitter.poast.org",
    "https://nitter.fdn.fr",
    "https://nitter.privacydev.net",
    "https://nitter.bus-hit.me",
  ];
}

async function fetchWithTimeout(url: string, timeoutMs = 12000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: ctl.signal,
      headers: {
        "accept": "application/rss+xml,text/xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": "bagsfinder/1.0 (+https://example.org)"
      },
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
}

function stripTrailingLink(text: string) {
  return text.replace(/\shttps?:\/\/\S+$/i, "").trim();
}

function toXUrl(nitterLink: string) {
  try {
    const u = new URL(nitterLink);
    const parts = u.pathname.split("/").filter(Boolean); // [user, status, id]
    if (parts.length >= 3 && parts[1] === "status") {
      return `https://x.com/${parts[0]}/status/${parts[2]}`;
    }
  } catch {}
  return nitterLink;
}

function getIdFromLink(link: string): string | null {
  const m = link.match(/\/status\/(\d+)/);
  return m ? m[1] : null;
}

function parseRss(xml: string): FeedItem[] {
  const out: FeedItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml))) {
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
    const id = getIdFromLink(link) || "";
    if (!id || !title) continue;

    out.push({
      id,
      text: stripTrailingLink(title),
      url: toXUrl(link),
      createdAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    });
  }

  out.sort((a, b) => {
    try { return (BigInt(b.id) > BigInt(a.id)) ? 1 : -1; }
    catch { return b.id.localeCompare(a.id); }
  });
  return out;
}

async function fetchRss(username: string): Promise<string> {
  const mirrors = getMirrors();
  const errs: string[] = [];
  for (const base of mirrors) {
    const url = `${base.replace(/\/+$/,"")}/${username}/rss`;
    try {
      const r = await fetchWithTimeout(url, 12000);
      if (!r.ok) { errs.push(`${base}: ${r.status}`); continue; }
      const text = await r.text();
      const ct = r.headers.get("content-type") || "";
      // Accept XML or text/plain that contains <rss
      if ((!ct.includes("xml") && !ct.includes("text")) || !text.includes("<rss")) {
        errs.push(`${base}: invalid content-type or format`);
        continue;
      }
      return text;
    } catch (e: any) {
      errs.push(`${base}: ${String(e?.message || e)}`);
    }
  }
  throw new Error(`All Nitter mirrors failed — ${errs.join(" | ")}`);
}

function cmpIdNewer(a: string, b: string) {
  try { return BigInt(a) > BigInt(b); } catch { return a > b; }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sinceId = (url.searchParams.get("since_id") || "").trim();
    const max = Math.max(1, Math.min(200, parseInt(url.searchParams.get("max") || "120", 10)));

    const xml = await fetchRss(ACCOUNT);
    const items = parseRss(xml);
    const filtered = sinceId ? items.filter(it => cmpIdNewer(it.id, sinceId)) : items;
    const limited = filtered.slice(0, max);

    return new Response(JSON.stringify({
      ok: true,
      count: limited.length,
      newestId: limited[0]?.id || null,
      items: limited
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        // public cache in frontends/CDNs to relax mirror load
        "cache-control": "s-maxage=60, stale-while-revalidate=300"
      }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 502,
      headers: { "content-type": "application/json" }
    });
  }
}