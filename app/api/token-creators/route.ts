import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE = "https://public-api-v2.bags.fm/api/v1";
const KEY = process.env.BAGS_API_KEY;

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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ca = (url.searchParams.get("ca") || url.searchParams.get("mint") || "").trim();
  if (!ca) return NextResponse.json({ ok:false, error:"Missing ?ca" }, { status:400 });

  // Небольшая проверка формата (у Solana mint обычно 32–44 символа)
  if (ca.length < 32 || ca.length > 48) {
    return NextResponse.json({ ok:false, error:"Invalid CA format" }, { status:400 });
  }

  const r = await bags(`/token-launch/creator/v2?tokenMint=${encodeURIComponent(ca)}`);
  if (!r.ok) return NextResponse.json({ ok:false, error:r.error }, { status:502 });

  const data = Array.isArray(r.json?.response) ? r.json.response : [];
  return NextResponse.json({ ok:true, data });
}