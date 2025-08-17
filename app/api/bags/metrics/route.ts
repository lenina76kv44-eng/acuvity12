import { NextResponse } from 'next/server';
import { getDemoMetrics } from '@/src/lib/sim/bags-demo';

// Если когда-нибудь захотите включать "живые" метрики —
// сохраните ваш прежний код под веткой else:
const DEMO = (process.env.NEXT_PUBLIC_BAGS_DEMO ?? '1') === '1';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (DEMO) {
    const data = getDemoMetrics();
    return NextResponse.json(data, { headers: { 'x-mode': 'demo' } });
  }
  // --- live mode (optional, оставить заглушку, чтобы не падать) ---
  // return NextResponse.json({ error: 'Live mode disabled' }, { status: 503 });
  const data = getDemoMetrics(); // safety fallback
  return NextResponse.json(data, { headers: { 'x-mode': 'demo-fallback' } });
}