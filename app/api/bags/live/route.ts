import { NextResponse } from "next/server";
import { envBags } from "@/src/lib/env-bags";
import { getRecentMintsByPrograms } from "@/src/lib/helius-bags";
import { getBirdeyeBundle } from "@/src/lib/birdeye";

export const revalidate = 0; // always fresh on request

export async function GET() {
  try {
    const hours = 24;
    const mints = await getRecentMintsByPrograms(envBags.programIds, envBags.heliusKey, hours, 300);

    // optional suffix filter (e.g., ..BAGS)
    const suffix = envBags.suffix?.trim();
    const filtered = suffix
      ? mints.filter(m => m.mint.endsWith(suffix) || true) // keep true if your suffix is in symbol only; symbol comes from Birdeye later
      : mints;

    const mintList = filtered.map(x => x.mint).slice(0, 400); // reasonable cap

    const map = envBags.birdeyeKey
      ? await getBirdeyeBundle(envBags.birdeyeBase, envBags.birdeyeKey, mintList)
      : {};

    // Derive metrics
    const list = mintList.map(m => ({ createdAt: mints.find(x => x.mint===m)?.ts || 0, ...map[m], mint: m }))
      // add symbol suffix test once we know symbol
      .filter(t => {
        if (!suffix) return true;
        const sym = (t.symbol || "").toUpperCase();
        return sym.endsWith(suffix.toUpperCase());
      });

    const totalVolume24h = list.reduce((s, x) => s + (x.volume24hUSD || 0), 0);
    const created24h = list.length;
    const activePairs = list.filter(x => (x.liquidityUSD || 0) > 0).length;

    // all-time if configured
    let totalTokensAllTime: number | null = null;
    if (envBags.statsUrl) {
      try {
        const r = await fetch(envBags.statsUrl, { cache: "no-store" });
        const j = await r.json();
        totalTokensAllTime = Number(j?.totalTokensAllTime) || null;
      } catch {}
    }

    // top-10 by market cap
    const top = [...list]
      .sort((a, b) => (b.marketCapUSD || 0) - (a.marketCapUSD || 0))
      .slice(0, 10);

    return NextResponse.json({
      meta: {
        hours,
        updatedAt: Date.now(),
      },
      metrics: {
        totalVolume24hUSD: totalVolume24h,
        created24h,
        activePairs24h: activePairs,
        totalTokensAllTime, // can be null
      },
      list: top,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}