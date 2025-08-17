import { NextResponse } from "next/server";
import { fetchBagsMintsSince } from "@/src/lib/bags/helius";
import { enrichMarkets } from "@/src/lib/markets/markets";

export const revalidate = 120; // SSG cache

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lookbackHours = Number(searchParams.get("h") || "24");
    const now = Math.floor(Date.now() / 1000);
    const since = now - lookbackHours * 3600;

    // 1) discover mints from Bags programs (last 24h)
    const mints24h = await fetchBagsMintsSince(since);

    // 2) For KPI "all-time tokens" we can return distinct mints we observed in last week as approximation
    // (If needed, add a weekly scan and persist; for now, just expose 24h and active.)
    const rows = await enrichMarkets(mints24h);

    // KPIs
    const totalTokens24h = mints24h.length;
    const totalLiquidity = rows.reduce((s,r)=> s + (r.liquidityUsd || 0), 0);
    const totalVol24h = rows.reduce((s,r)=> s + (r.vol24h || 0), 0);

    // active = rows that currently have liquidity > 0
    const activeTokens = rows.filter(r => (r.liquidityUsd||0) > 0).length;

    // top 10 by FDV
    const top = [...rows].sort((a,b)=> (b.fdvUsd||0) - (a.fdvUsd||0)).slice(0,10);

    return NextResponse.json({
      ok: true,
      kpis: {
        totalTokens24h,
        activeTokens,
        totalLiquidity,
        totalVol24h,
        // leave allTimeTokens null for now unless we add persistence
        allTimeTokens: null
      },
      top
    });
  } catch (e: any) {
    console.error("bags/markets error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}