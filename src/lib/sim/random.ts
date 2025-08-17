// Deterministic PRNG (mulberry32) + helpers
export function seedFromMinute(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const d0 = d.getUTCDate();
  const h = d.getUTCHours();
  const min = d.getUTCMinutes();
  return (((((y * 100 + m) * 100 + d0) * 100 + h) * 100) + min) >>> 0;
}

export function mulberry32(a: number) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drift(base: number, maxPct: number, rnd: () => number) {
  const sign = rnd() < 0.5 ? -1 : 1;
  const pct = rnd() * maxPct;
  const val = base * (1 + sign * pct);
  return val;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}