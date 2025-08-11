import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE = "https://public-api-v2.bags.fm/api/v1";
const KEY = "bags_prod_WLmpt-ZMCdFmN3WsFBON5aJnhYMzkwAUsyIJLZ3tORY";

async function bags(path: string) {
  if (!KEY) return { ok: false, error: "Missing BAGS_API_KEY" };
  try {
    const r = await fetch(`${API_BASE}${path}`, {
      headers: { "x-api-key": KEY, accept: "application/json" },
      cache: "no-store",
    });
    const raw = await r.text();
    if (!r.ok) return { ok: false, error: `${r.status}: ${raw.slice(0,200)}` };
    try { return { ok: true, json: JSON.parse(raw) }; }
    catch { return { ok: false, error: `Invalid JSON: ${raw.slice(0,200)}` }; }
  } catch (e: any) {
    return { ok: false, error: `Fetch failed: ${e?.message || e}` };
  }
}

const asArray = (v: any) => (Array.isArray(v) ? v : []);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = (url.searchParams.get("wallet") || "").trim();
  if (!wallet) return NextResponse.json({ ok:false, error:"Missing ?wallet" }, { status:400 });

  // 1) кошелёк → его запуски (минты)
  const lRes = await bags(`/token-launch/wallet?wallet=${encodeURIComponent(wallet)}`);
  if (!lRes.ok) return NextResponse.json({ ok:false, error:lRes.error }, { status:502 });

  const mints = Array.from(new Set(
    asArray(lRes.json?.response).map((t: any) => String(t?.tokenMint)).filter(Boolean)
  )).slice(0, 200); // лимитим, чтобы не упереться в rate limit

  if (!mints.length) return NextResponse.json({ ok:true, data: [] });

  // 2) по каждому mint → создатели (параллельно)
  const creatorsRes = await Promise.all(
    mints.map(m => bags(`/token-launch/creator/v2?tokenMint=${encodeURIComponent(m)}`))
  );

  // 3) берём только записи, где наш кошелёк фигурирует среди создателей
  const rows: any[] = [];
  creatorsRes.forEach((cr, i) => {
    const mint = mints[i];
    if (!cr.ok) return;
    asArray(cr.json?.response).forEach((c: any) => {
      if (String(c?.wallet) === wallet) {
        rows.push({
          mint,
          role: c?.isCreator ? "creator" : "fee-share",
          twitter: c?.twitterUsername ?? null,
          username: c?.username ?? null,
          royaltyPct: typeof c?.royaltyBps === "number" ? c.royaltyBps / 100 : null,
        });
      }
    });
  });

  return NextResponse.json({ ok:true, data: rows });
}