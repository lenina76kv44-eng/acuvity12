export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type FeedItem = {
  id: string;
  text: string;      // trailing link removed
  url: string;       // https://x.com/<user>/status/<id>
  createdAt: string; // ISO
};

const ACCOUNT = "BagsWhaleBot";

// Allow override: NITTER_HOSTS="https://nitter.net,https://nitter.poast.org"
function nitterMirrors(): string[] {
  const raw = (process.env.NITTER_HOSTS || "").trim();
  if (raw) return raw.split(",").map(s => s.trim()).filter(Boolean);
  return [
    "https://nitter.cz",
    "https://nitter.nl",
    "https://nitter.it",
    "https://nitter.unixfox.eu",
    "https://nitter.moomoo.me",
    "https://nitter.net",
    "https://nitter.poast.org",
  ];
}

async function fetchWithTimeout(url: string, timeoutMs = 12000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: ctl.signal,
      headers: {
        "accept": "application/rss+xml,text/xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
        "user-agent": "bagsfinder/1.0 (+https://example.org)"
      },
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
}

function stripTrailingLink(text: string) {
  // remove only one trailing URL at the very end; keep inline links
  return text.replace(/\shttps?:\/\/\S+$/i, "").trim();
}

function toXUrl(nitterLink: string): string {
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

function looksLikeRss(txt: string) {
  return /<rss[\s>]/i.test(txt) || /<channel[\s>]/i.test(txt);
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
  // newest → oldest
  out.sort((a, b) => {
    try { return (BigInt(b.id) > BigInt(a.id)) ? 1 : -1; }
    catch { return b.id.localeCompare(a.id); }
  });
  return out;
}

// Try until one returns valid RSS
async function fetchRss(username: string): Promise<string> {
  const errs: string[] = [];

  // 1) Direct Nitter mirrors
  for (const base of nitterMirrors()) {
    const url = `${base.replace(/\/+$/,"")}/${username}/rss`;
    try {
      const r = await fetchWithTimeout(url, 12000);
      const ct = (r.headers.get("content-type") || "").toLowerCase();
      const txt = await r.text();
      if (r.ok && (ct.includes("xml") || ct.includes("rss") || ct.includes("text")) && looksLikeRss(txt)) {
        return txt;
      }
      errs.push(`${base}: ${r.status || "invalid"}${ct ? ` (${ct})` : ""}`);
    } catch (e: any) {
      errs.push(`${base}: ${String(e?.message || e)}`);
    }
  }

  // 2) Same mirrors via r.jina.ai (bypasses CF/CORS in many cases)
  for (const base of nitterMirrors()) {
    const host = base.replace(/^https?:\/\//, "");
    const url = `https://r.jina.ai/http://${host}/${username}/rss`;
    try {
      const r = await fetchWithTimeout(url, 12000);
      const txt = await r.text();
      if (r.ok && looksLikeRss(txt)) return txt;
      errs.push(`jina->${host}: bad format`);
    } catch (e: any) {
      errs.push(`jina->${host}: ${String(e?.message || e)}`);
    }
  }

  // 3) RSSHub fallbacks (public instance; OK for preview)
  const rsshub = [
    `https://rsshub.app/x/user/${username}`,
    `https://rsshub.app/twitter/user/${username}`,
  ];
  for (const url of rsshub) {
    try {
      const r = await fetchWithTimeout(url, 12000);
      const txt = await r.text();
      if (r.ok && looksLikeRss(txt)) return txt;
    } catch (e: any) {
      errs.push(`rsshub: ${String(e?.message || e)}`);
    }
  }

  throw new Error(`All sources failed — ${errs.join(" | ")}`);
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