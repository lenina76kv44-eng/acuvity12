export const envBags = {
  heliusKey: process.env.HELIUS_API_KEY!,                // already in locked .env.local
  birdeyeKey: process.env.BIRDEYE_API_KEY || "",
  birdeyeBase: process.env.BIRDEYE_BASE || "https://public-api.birdeye.so",
  suffix: process.env.NEXT_PUBLIC_BAGS_SUFFIX || "BAGS",
  programIds: (process.env.BAGS_PROGRAM_IDS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean),
  statsUrl: process.env.BAGS_STATS_URL || "",
};