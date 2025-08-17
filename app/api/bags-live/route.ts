// app/api/bags-live/route.ts
import { NextResponse } from 'next/server';
import { fetchBagsUniverse, computeMetrics } from '@/src/lib/dexscreener';

export const revalidate = 60; // cache 60s on the edge

export async function GET() {
  try {
    const suffix = process.env.BAGS_MINT_SUFFIX || 'BAGS';
    const pairs = await fetchBagsUniverse(suffix);
    const { totals, top } = computeMetrics(pairs);
    return NextResponse.json({
      ok: true,
      updatedAt: Date.now(),
      suffix,
      totals,
      list: top,
      countUniverse: pairs.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}