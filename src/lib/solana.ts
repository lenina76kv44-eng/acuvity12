// src/lib/solana.ts
export type EnhancedTx = any;

const eq = (a?: string, b?: string) => (a || "").toLowerCase() === (b || "").toLowerCase();

const STABLE_AND_MAJORS = new Set([
  "So11111111111111111111111111111111111111112", // wSOL
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", // RAY
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", // mSOL
  "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj", // stSOL
]);

function asArray<T=any>(v:any): T[] { return Array.isArray(v) ? v : (v ? [v] : []); }

function displayAmount(t:any) {
  const decimals = Number(t?.rawTokenAmount?.decimals ?? t?.decimals ?? 9);
  const rawStr = t?.rawTokenAmount?.tokenAmount ?? t?.tokenAmount ?? t?.amount ?? 0;
  const raw = Number(rawStr);
  if (!isFinite(raw) || !isFinite(decimals)) return 0;
  return raw / 10**decimals;
}
function isMeaningfulIncoming(t:any) {
  return displayAmount(t) >= 0.0005; // tiny, но отсекает мусор/airdrop-дутьё
}

function lamportsSpentBy(wallet: string, nt: any[]) {
  return nt.filter(n => n?.fromUserAccount === wallet).reduce((s,n)=> s + Number(n?.amount||0), 0);
}
function spentStableOrMajors(wallet: string, tt: any[]) {
  return tt.some(t =>
    (t?.fromUserAccount===wallet || t?.fromUserAccountOwner===wallet) &&
    STABLE_AND_MAJORS.has(t?.mint) &&
    Number(t?.tokenAmount ?? t?.amount ?? 0) > 0
  );
}

/** Return SPL mints the wallet likely ACQUIRED in this tx.  */
export function getBoughtTokenMints(tx: EnhancedTx, wallet: string): Set<string> {
  const out = new Set<string>();
  try {
    const tt = asArray(tx?.tokenTransfers);
    const nt = asArray(tx?.nativeTransfers);

    // swap user? (Helius может класть и в events.swap, и в events.swaps[])
    const swapsArr = asArray(tx?.events?.swaps);
    const swapUserHit = (tx?.events?.swap?.user === wallet) || swapsArr.some((s:any)=> s?.user === wallet);

    // входящие токены на сам кошелёк ИЛИ на ATA, где owner = wallet
    const incoming = tt.filter((t:any)=>
      (t?.toUserAccount===wallet || t?.toUserAccountOwner===wallet) &&
      t?.mint && !STABLE_AND_MAJORS.has(t.mint) &&
      isMeaningfulIncoming(t)
    );

    const paidSol = lamportsSpentBy(wallet, nt) > 0;           // оплата SOL
    const paidStable = spentStableOrMajors(wallet, tt);        // оплата стейблами/мажорами
    const paid = swapUserHit || paidSol || paidStable;

    // (1) классический своп: входящий SPL + оплата (SOL/стейблы) или swap.user = wallet
    if (incoming.length && paid) {
      incoming.forEach((t:any)=> out.add(String(t.mint)));
    }

    // (2) bonding-curve / pump: mint → на ATA владельца + оплата
    if (paid) {
      tt.forEach((t:any)=>{
        const isMintToMe =
          !t?.fromUserAccount &&
          (t?.toUserAccountOwner === wallet) &&
          t?.mint && !STABLE_AND_MAJORS.has(t.mint) &&
          isMeaningfulIncoming(t);
        if (isMintToMe) out.add(String(t.mint));
      });
    }

    // (3) fallback для редких SWAP-транзакций без событий
    if (tx?.type === "SWAP" && !out.size) {
      tt.forEach((tr:any)=>{
        const to = tr?.toUserAccount || tr?.toUserAccountOwner;
        const from = tr?.fromUserAccount || tr?.fromUserAccountOwner;
        const mint = tr?.mint;
        if (mint && !STABLE_AND_MAJORS.has(mint) && to && eq(to, wallet) && (!from || !eq(from, wallet))) {
          out.add(mint);
        }
      });
    }
  } catch {}
  return out;
}

/** Shared ≥2 (не строгое пересечение) */
export function intersectMany(sets: Set<string>[]): string[] {
  if (!sets.length) return [];
  const freq: Record<string, number> = {};
  for (const s of sets) for (const m of s) freq[m] = (freq[m] ?? 0) + 1;
  return Object.entries(freq)
    .filter(([, c]) => c >= 2)
    .map(([m]) => m);
}

/** (опционально) Helius batch */
export async function fetchTokenMetadata(mints: string[], apiKey: string): Promise<any[]> {
  if (!mints.length) return [];
  try {
    const res = await fetch(`https://api.helius.xyz/v0/tokens/metadata?api-key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mintAccounts: mints.slice(0,100) })
    });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}