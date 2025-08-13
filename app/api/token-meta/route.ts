import { NextResponse } from "next/server";
import { fetchTextRetry } from "@/lib/retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS_KEY = process.env.HELIUS_API_KEY || "";
const RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;

type Meta = { name: string|null; symbol: string|null; image: string|null; decimals: number|null };

function pickMeta(a: any): Meta {
  const md = a?.content?.metadata || {};
  const links = a?.content?.links || {};
  const ti = a?.token_info || {};
  return {
    name: md.name ?? a?.name ?? null,
    symbol: (md.symbol ?? ti.symbol ?? null) || null,
    image: (links.image ?? links.thumbnail ?? null) || null,
    decimals: typeof ti.decimals === "number" ? ti.decimals : null,
  };
}

async function rpcCall(body: any) {
  const raw = await fetchTextRetry(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = JSON.parse(raw);
  if (json.error) throw new Error(String(json.error?.message || "RPC error"));
  return json.result;
}

export async function POST(req: Request) {
  if (!HELIUS_KEY) return NextResponse.json({ ok:false, error:"Missing HELIUS_API_KEY" }, { status:500 });
  const j = await req.json().catch(()=> ({}));
  const mints: string[] = Array.isArray(j?.mints) ? j.mints.map(String) : [];
  if (!mints.length) return NextResponse.json({ ok:false, error:"Body { mints: string[] } required" }, { status:400 });

  const uniq = Array.from(new Set(mints)).slice(0, 200);
  const out: Record<string, Meta> = {};

  // getAssetBatch рекомендуют дробить; ~80 за батч — безопасно
  for (let i = 0; i < uniq.length; i += 80) {
    const chunk = uniq.slice(i, i + 80);
    const result = await rpcCall({ jsonrpc:"2.0", id:"bags", method:"getAssetBatch", params:{ ids: chunk } });
    const assets: any[] = Array.isArray(result) ? result : [];
    for (let k = 0; k < chunk.length; k++) {
      const a = assets[k];
      const id = a?.id || chunk[k];
      out[id] = a ? pickMeta(a) : { name:null, symbol:null, image:null, decimals:null };
    }
  }
  return NextResponse.json({ ok:true, data: out });
}