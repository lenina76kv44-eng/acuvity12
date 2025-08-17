export const BAGS_ENV = {
  HELIUS_API_KEY: process.env.HELIUS_API_KEY,
  BAGS_API_KEY: process.env.BAGS_API_KEY || "",
  BAGS_PROGRAM_IDS: (process.env.BAGS_PROGRAM_IDS || "").split(",").map(s=>s.trim()).filter(Boolean),
  BAGS_ACTOR_IDS: (process.env.BAGS_ACTOR_IDS || "").split(",").map(s=>s.trim()).filter(Boolean),
};