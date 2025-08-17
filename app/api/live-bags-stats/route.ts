import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/src/lib/cache';
import { discoverBagsMints24h } from '@/src/lib/bagsDiscovery';
import { getTokenSupply } from '@/src/lib/helius';
import { getJupPriceUsd } from '@/src/lib/jupiter';
import { getDexSnapshotByMint } from '@/src/lib/dexscreener';

type Row = {
  mint: string;
  priceUsd: number;
  supply: number;
  fdv: number;
  volume24h: number;
  liquidityUsd: number;
  link?: string;
};

export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === '1' || searchParams.get('force') === 'true';
  const cacheKey = 'bags_live_stats_v2';
  const cached = !force ? getCache<any>(cacheKey) : null;
  if (cached) return NextResponse.json(cached, { headers: { 'x-cache': 'HIT' } });

  // 1) discover mints created via Bags in last 24h
  const mints = await discoverBagsMints24h();

  // 2) enrich a bounded subset for table (up to 60 mints); totals считаем по всем, но с лимитом параллелизма
  const sample = mints.slice(0, 60);

  const concurrency = 6;
  const queue: Row[] = [];
  async function enrich(mint: string): Promise<Row | null> {
    const [price, supply, dex] = await Promise.all([
      getJupPriceUsd(mint),
      getTokenSupply(mint),
      getDexSnapshotByMint(mint),
    ]);
    const priceUsd = price ?? (Number(dex.priceUsd) || 0);
    const s = supply ?? 0;
    const fdv = priceUsd && s ? priceUsd * s : (dex.fdv || 0);
    return { mint, priceUsd, supply: s, fdv, volume24h: dex.volume24h, liquidityUsd: dex.liquidityUsd, link: dex.url || undefined };
  }

  const batches: Row[] = [];
  for (let i=0; i<sample.length; i+=concurrency) {
    const chunk = sample.slice(i, i+concurrency);
    const res = await Promise.allSettled(chunk.map(enrich));
    for (const r of res) if (r.status === 'fulfilled' && r.value) batches.push(r.value);
  }

  const totalTokens24h = mints.length;
  const activeTokens = batches.filter(r => r.liquidityUsd > 0 || r.volume24h > 0).length;
  const totalVolume24h = batches.reduce((s, r) => s + (r.volume24h || 0), 0);
  const totalFdv = batches.reduce((s, r) => s + (r.fdv || 0), 0);

  // NOTE: total tokens all-time: we cannot scan whole chain every time.
  // Keep a soft accumulator in cache (you can replace with DB later).
  const allTimeKey = 'bags_all_time_counter';
  let allTime = getCache<number>(allTimeKey) ?? 0;
  // naive: grow monotonic if today > cached
  if (totalTokens24h > 0 && totalTokens24h > (getCache<number>('bags_last_24_count') ?? 0)) {
    allTime += (totalTokens24h - (getCache<number>('bags_last_24_count') ?? 0));
    setCache(allTimeKey, allTime, 7*24*60*60*1000);
  }
  setCache('bags_last_24_count', totalTokens24h, 24*60*60*1000);

  const table = batches.sort((a,b) => b.fdv - a.fdv).slice(0, 10);

  const payload = {
    updatedAt: Date.now(),
    counters: {
      totalTokens24h,
      activeTokens,
      totalVolume24h,
      totalFdv,
      allTimeTokens: allTime, // placeholder until you back it with persistent storage
    },
    list: table
  };

  setCache(cacheKey, payload, 60 * 1000); // 60s
  return NextResponse.json(payload, { headers: { 'x-cache': 'MISS' } });
}