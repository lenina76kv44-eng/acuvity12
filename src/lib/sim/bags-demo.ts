import { drift, mulberry32, seedFromMinute, clamp } from './random';

export type DemoMetrics = {
  updatedAt: number;
  totals: {
    // 4 KPI:
    tokensAllTime: number;   // все время
    tokens24h: number;       // за 24 часа
    vol24hUsd: number;       // 24h volume
    liquidityUsd: number;    // total liquidity
  };
  demo: true;
};

// Базовые "реалистичные" опорные значения — при необходимости поменяйте.
const BASE = {
  tokensAllTime: 23500,
  tokens24h:     520,
  vol24hUsd:     260_000_000, // $260M
  liquidityUsd:  115_000_000, // $115M
};

// Сохраняем мягкую инерцию в области модуля (живёт в процессе)
let last: DemoMetrics | null = null;

export function getDemoMetrics(): DemoMetrics {
  const seed = seedFromMinute(new Date());
  const rnd = mulberry32(seed);

  // Лёгкий дрейф в узких коридорах:
  // объемы/ликвидность ±0.6–1.0%, счётчики ±0.2–0.6%
  const tokensAllTime = Math.round(clamp(
    drift((last?.totals.tokensAllTime ?? BASE.tokensAllTime), 0.004, rnd),
    10_000, 1_000_000
  ));
  const tokens24h = Math.round(clamp(
    drift((last?.totals.tokens24h ?? BASE.tokens24h), 0.006, rnd),
    10, 5000
  ));
  const vol24hUsd = Math.round(clamp(
    drift((last?.totals.vol24hUsd ?? BASE.vol24hUsd), 0.010, rnd),
    1_000_000, 5_000_000_000
  ));
  const liquidityUsd = Math.round(clamp(
    drift((last?.totals.liquidityUsd ?? BASE.liquidityUsd), 0.008, rnd),
    1_000_000, 5_000_000_000
  ));

  last = {
    updatedAt: Date.now(),
    totals: { tokensAllTime, tokens24h, vol24hUsd, liquidityUsd },
    demo: true,
  };
  return last;
}