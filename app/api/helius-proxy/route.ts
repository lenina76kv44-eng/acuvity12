import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";

export async function GET(req: Request) {
  if (!HELIUS_API_KEY) {
    return NextResponse.json({ error: "Missing HELIUS_API_KEY" }, { status: 500 });
  }

  const url = new URL(req.url);
  const address = url.searchParams.get("address");
  const limit = url.searchParams.get("limit") || "100";
  const before = url.searchParams.get("before");

  if (!address) {
    return NextResponse.json({ error: "Missing address parameter" }, { status: 400 });
  }

  try {
    const heliusUrl = new URL(`https://api.helius.xyz/v0/addresses/${address}/transactions`);
    heliusUrl.searchParams.set("api-key", HELIUS_API_KEY);
    heliusUrl.searchParams.set("limit", limit);
    if (before) heliusUrl.searchParams.set("before", before);

    const response = await fetch(heliusUrl.toString(), {
      method: "GET",
      headers: { "accept": "application/json" },
      cache: "no-store"
    });

    const data = await response.text();
    
    if (!response.ok) {
      return NextResponse.json({ error: `Helius API error: ${response.status}` }, { status: response.status });
    }

    return new NextResponse(data, {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Request failed" }, { status: 500 });
  }
}