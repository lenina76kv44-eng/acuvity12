// env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_BAGS_SUFFIX?: string;
    BAGS_STATS_URL?: string; // optional external backend for all-time count
  }
}