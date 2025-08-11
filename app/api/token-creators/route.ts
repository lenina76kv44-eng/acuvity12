import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE = "https://public-api-v2.bags.fm/api/v1";
const API_KEY = "bags_prod_WLmpt-ZMCdFmN3WsFBON5aJnhYMzkwAUsyIJLZ3tORY";

async function bagsApi(path: string) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 
        "x-api-key": API_KEY, 
        "accept": "application/json" 
      },
    });
    const raw = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${raw.slice(0,200)}` };
    try { 
      return { ok: true, json: JSON.parse(raw) }; 
    } catch { 
      return { ok: false, error: `Invalid JSON: ${raw.slice(0,200)}` }; 
    }
  } catch (e: any) {
    return { ok: false, error: `Fetch failed: ${String(e?.message || e)}` };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ca = (url.searchParams.get("ca") || "").trim();
  if (!ca) return NextResponse.json({ ok:false, error:"Missing ?ca" }, { status:400 });

  // Light base58 sanity check
  if (ca.length < 32 || ca.length > 48) {
    return NextResponse.json({ ok:false, error:"Invalid CA format" }, { status:400 });
  }
  
  try {
    const r = await bagsApi(`/token-launch/creator/v2?tokenMint=${encodeURIComponent(ca)}`);
    if (!r.ok) throw new Error(r.error);
    
    const data = Array.isArray(r.json?.response) ? r.json.response : [];
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}