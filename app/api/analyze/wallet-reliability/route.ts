import { env, okJson, badJson, asArray } from "@/lib/env";
import { fetchJsonRetry, fetchTextRetry, sleep } from "@/lib/retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS = () => env("HELIUS_API_KEY");
const OPENAI = () => (process.env.OPENAI_API_KEY || "");

async function fetchPages(addr: string, pages: number, limit: number) {
  const out: any[] = [];
  let before: string | undefined;
  let lim = limit;

  for (let i = 0; i < pages; i++) {
    const u = new URL(`https://api.helius.xyz/v0/addresses/${addr}/transactions`);
    u.searchParams.set("api-key", HELIUS());
    u.searchParams.set("limit", String(lim));
    if (before) u.searchParams.set("before", before);

    try {
      const arr = await fetchJsonRetry<any[]>(u.toString(), {}, { retries: 3, timeoutMs: 20000 });
      if (!Array.isArray(arr) || arr.length === 0) break;
      out.push(...arr);
      before = arr[arr.length - 1]?.signature;
      await sleep(120);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (/429|502|503|504|timeout|aborted|socket/i.test(msg) && lim > 50) {
        lim = Math.max(40, Math.floor(lim * 0.7));
        i--; await sleep(400); continue;
      }
      throw e;
    }
  }
  return out;
}

function basicFeatures(txs: any[], address: string) {
  const now = Math.floor(Date.now()/1000);
  const monthAgo = now - 30*24*3600;
  const tt = txs.flatMap(t => asArray(t?.tokenTransfers));
  const nt = txs.flatMap(t => asArray(t?.nativeTransfers));

  const buys = tt.filter(t => t?.toUserAccount === address);
  const sells = tt.filter(t => t?.fromUserAccount === address);
  const lastTs = Math.max(0, ...txs.map(t => Number(t?.timestamp || 0)));
  const recent = txs.filter(t => Number(t?.timestamp||0) >= monthAgo).length;

  return {
    txCount: txs.length,
    tokenTransfers: tt.length,
    buys: buys.length,
    sells: sells.length,
    recentTxs: recent,
    lastActivityAgoDays: lastTs ? Math.round((now - lastTs)/(24*3600)) : null,
  };
}

async function aiSummary(features: any, address: string) {
  const key = OPENAI();
  if (!key) {
    return { usedAI: false, score: 50, redFlags: ["AI disabled"], summary: "Heuristic score only." };
  }
  try {
    const resTxt = await fetchTextRetry("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Return strict JSON: {score:number, redFlags:string[], summary:string}" },
          { role: "user", content:
`Address: ${address}
Features: ${JSON.stringify(features)}`
          }
        ],
        temperature: 0.2
      })
    }, { retries: 2, timeoutMs: 25000 });

    const j = JSON.parse(resTxt);
    const content = j?.choices?.[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(content);
    return { usedAI: true, ...parsed };
  } catch {
    const score = Math.max(5, Math.min(95, 70 - (features.sells - features.buys) - (features.lastActivityAgoDays || 0)));
    return { usedAI: false, score, redFlags: ["AI timeout; heuristic only"], summary: "AI unavailable; heuristic score." };
  }
}

export async function GET(req: Request) {
  try {
    if (!HELIUS()) return badJson("Missing HELIUS_API_KEY", 500);

    const url = new URL(req.url);
    const address = (url.searchParams.get("address") || "").trim();
    const pages = Math.max(1, Math.min(10, parseInt(url.searchParams.get("pages") || "5", 10)));
    const limit = Math.max(20, Math.min(100, parseInt(url.searchParams.get("limit") || "100", 10)));
    if (!address) return badJson("Provide ?address=", 400);

    const txs = await fetchPages(address, pages, limit);
    const features = basicFeatures(txs, address);
    const ai = await aiSummary(features, address);
    return okJson({ ok: true, input: { address, pages, limit }, features, ai });
  } catch (e: any) {
    return badJson(`Analysis failed: ${e?.message || String(e)}`, 502);
  }
}