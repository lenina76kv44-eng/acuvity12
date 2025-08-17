// app/api/bags/markets/route.ts
import { NextResponse } from "next/server";
import { fetchSolanaLatestPairs, dedupeByBaseMint, onlyCreatedLast24h, filterByBagsSuffix, toMetrics } from "@/src/lib/dexscreener";

export const revalidate = 30; // SSR cache window (seconds)

async function fetchAllTimeTokensFromExternal(): Promise<number | null> {
  const url = process.env.BAGS_STATS_URL?.trim();
  if (!url) return null;
  try {
    const r = await fetch(url, { cache: "no-store", headers: { "Accept": "application/json" } });
    if (!r.ok) return null;
    const j = await r.json();
    const n = Number(j?.totalTokensAllTime);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const [pairs, totalAll] = await Promise.all([
      fetchSolanaLatestPairs(),
      fetchAllTimeTokensFromExternal(),
    ]);

    // 1) последние пары за 24 часа
    let candidates = onlyCreatedLast24h(pairs);
    // 2) уникальные по base mint
    candidates = dedupeByBaseMint(candidates);
    // 3) фильтр "bags"-мяток по суффиксу (если NEXT_PUBLIC_BAGS_SUFFIX не задан — пропускаем)
    const suffix = process.env.NEXT_PUBLIC_BAGS_SUFFIX || "BAGS";
    candidates = filterByBagsSuffix(candidates, suffix);

    const metrics = toMetrics(candidates, totalAll);
    return NextResponse.json({ ok: true, data: metrics }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 }
    );
  }
}