import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const RPC = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ""}`;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const address = (url.searchParams.get("address") || "").trim();
    if (!address) return NextResponse.json({ ok:false, error:"Missing ?address" }, { status:400 });
    if (!process.env.HELIUS_API_KEY) return NextResponse.json({ ok:false, error:"Missing HELIUS_API_KEY" }, { status:500 });

    const r = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc:"2.0", id:"bags", method:"getBalance", params:[address] })
    });
    const raw = await r.text();
    if (!r.ok) return NextResponse.json({ ok:false, error:`${r.status}: ${raw.slice(0,200)}` }, { status:502 });

    let j:any; try { j = JSON.parse(raw); } catch {
      return NextResponse.json({ ok:false, error:`Invalid JSON: ${raw.slice(0,200)}` }, { status:502 });
    }

    const lamports = j?.result?.value ?? 0;
    const solBalance = Number((lamports / 1e9).toFixed(6));
    return NextResponse.json({ ok:true, address, solBalance });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || String(e) }, { status:500 });
  }
}