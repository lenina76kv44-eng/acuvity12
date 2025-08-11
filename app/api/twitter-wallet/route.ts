import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE = "https://public-api-v2.bags.fm/api/v1";
const API_KEY = process.env.BAGS_API_KEY || "bags_prod_WLmpt-ZMCdFmN3WsFBON5aJnhYMzkwAUsyIJLZ3tORY";

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
  const handle = (url.searchParams.get("handle") || "").trim();
  if (!handle) return NextResponse.json({ ok:false, error:"Missing ?handle" }, { status:400 });

  // Validate Twitter handle
  if (!/^[a-z0-9_]{1,15}$/.test(handle)) {
    return NextResponse.json({ ok:false, error:"Invalid Twitter handle" }, { status:400 });
  }

  try {
    const r = await bagsApi(`/token-launch/fee-share/wallet/twitter?twitterUsername=${encodeURIComponent(handle)}`);
    if (!r.ok) return NextResponse.json({ ok:false, error:r.error }, { status:502 });
    
    const wallet = r.json?.response ?? null;
    return NextResponse.json({ ok: true, wallet });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e.message || String(e) }, { status: 500 });
  }
}