import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE = "https://public-api-v2.bags.fm/api/v1";
const KEY = process.env.BAGS_API_KEY || "";

async function passthrough(req: Request, parts: string[]) {
  if (!KEY) return NextResponse.json({ ok: false, error: "Missing BAGS_API_KEY" }, { status: 500 });
  
  const qs = new URL(req.url).search || "";
  const url = `${API_BASE}/${(parts || []).join("/")}${qs}`;
  
  const up = await fetch(url, {
    method: req.method,
    headers: { 
      "x-api-key": KEY, 
      "accept": "application/json" 
    },
    cache: "no-store",
    body: ["POST", "PUT", "PATCH"].includes(req.method) ? await req.text() : undefined,
  });
  
  const body = await up.text();
  return new NextResponse(body, {
    status: up.status,
    headers: { 
      "content-type": up.headers.get("content-type") || "application/json" 
    },
  });
}

export async function GET(req: Request, ctx: { params: { path: string[] } }) {
  return passthrough(req, ctx.params.path);
}

export async function POST(req: Request, ctx: { params: { path: string[] } }) {
  return passthrough(req, ctx.params.path);
}