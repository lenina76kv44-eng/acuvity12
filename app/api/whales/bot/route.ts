import { NextResponse } from 'next/server';
import { getLatestTweets } from '@/src/lib/whales';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// tiny in-memory cache to avoid hammering mirrors
const cache = new Map<string, { t: number; data: any }>();
const TTL = 60 * 1000; // 60s

export async function GET(req: Request) {
  const u = new URL(req.url);
  const handle = (u.searchParams.get('handle') || process.env.WHALE_SCREEN_NAME || 'BagsWhaleBot').replace(/^@/, '');
  const limit = Math.min(50, Math.max(1, parseInt(u.searchParams.get('limit') || '25', 10)));

  const key = `${handle}:${limit}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.t < TTL) {
    return NextResponse.json(hit.data);
  }

  try {
    const list = await getLatestTweets(handle, limit);
    const payload = { ok: true, handle, count: list.length, list };
    cache.set(key, { t: now, data: payload });
    return NextResponse.json(payload);
  } catch (e: any) {
    const msg = String(e?.message || e);
    const err = { ok: false, error: msg };
    return NextResponse.json(err, { status: 502 });
  }
}