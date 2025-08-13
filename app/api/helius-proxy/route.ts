import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";

const sleep = (ms:number)=> new Promise(r=>setTimeout(r,ms));

async function fetchWithRetry(u: URL, tries = 5, timeoutMs = 20000) {
  for (let i=1;i<=tries;i++){
    const ctl = new AbortController();
    const t = setTimeout(()=>ctl.abort(), timeoutMs);
    try {
      const r = await fetch(u.toString(), { signal: ctl.signal, headers: { accept: "application/json" }, cache:"no-store" });
      const raw = await r.text();
      if (!r.ok) {
        if ((r.status===429 || r.status===502 || r.status===503 || r.status===504) && i < tries) {
          await sleep(300*i*i);
          continue;
        }
        return NextResponse.json({ ok:false, error:`Helius ${r.status}: ${raw.slice(0,200)}` }, { status:r.status });
      }
      clearTimeout(t);
      return new NextResponse(raw, { status: 200, headers: { "content-type":"application/json" }});
    } catch (e:any) {
      clearTimeout(t);
      const msg = String(e?.message||e);
      if (/aborted|timeout|network|socket/i.test(msg) && i < tries) {
        await sleep(300*i*i);
        continue;
      }
      return NextResponse.json({ ok:false, error: msg }, { status: 502 });
    }
  }
  return NextResponse.json({ ok:false, error: "Failed after retries" }, { status: 502 });
}

export async function GET(req: Request) {
  if (!HELIUS_API_KEY) return NextResponse.json({ ok:false, error:"Missing HELIUS_API_KEY" }, { status:500 });

  const url = new URL(req.url);
  const address = (url.searchParams.get("address") || "").trim();
  const before  = url.searchParams.get("before") || "";
  const limit   = Math.max(1, Math.min(200, parseInt(url.searchParams.get("limit") || "100", 10)));

  if (!address) return NextResponse.json({ ok:false, error:"Missing ?address" }, { status:400 });

  const u = new URL(`https://api.helius.xyz/v0/addresses/${address}/transactions`);
  u.searchParams.set("api-key", HELIUS_API_KEY);
  u.searchParams.set("limit", String(limit));
  if (before) u.searchParams.set("before", before);

  return fetchWithRetry(u, 3, 20000);
}