export type EnhancedTx = any;

const eq = (a?: string, b?: string) => (a || "").toLowerCase() === (b || "").toLowerCase();

const STABLE_AND_MAJORS = new Set([
  'So11111111111111111111111111111111111111112', // wSOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', // stSOL
]);

function asArray<T=any>(v:any): T[] { return Array.isArray(v) ? v : (v ? [v] : []); }
function lamportsSpentBy(wallet: string, nt: any[]) {
  return nt.filter(n => n?.fromUserAccount === wallet).reduce((s,n)=> s + Number(n?.amount||0), 0);
}
function spentStable(wallet: string, tt: any[]) {
  return tt.some(t => t?.fromUserAccount===wallet && STABLE_AND_MAJORS.has(t?.mint) && Number(t?.tokenAmount ?? t?.amount ?? 0) > 0);
}
function isMeaningfulIncoming(t:any) {
  const dec = Number(t?.decimals ?? 9);
  const raw = Number(t?.tokenAmount ?? t?.amount ?? 0);
  if (!raw) return false;
  const display = raw / 10**dec;
  return display >= 0.0005;
}

/** Return SPL mints the wallet likely ACQUIRED in this tx. */
export function getBoughtTokenMints(tx: EnhancedTx, wallet: string): Set<string> {
  const out = new Set<string>();
  try {
    const tt = asArray(tx?.tokenTransfers);
    const nt = asArray(tx?.nativeTransfers);

    // swap user?
    const swapsArr = asArray(tx?.events?.swaps);
    const swapUserHit = (tx?.events?.swap?.user === wallet) || swapsArr.some((s:any)=> s?.user === wallet);

    const incoming = tt.filter((t:any)=>
      t?.toUserAccount===wallet && t?.mint && !STABLE_AND_MAJORS.has(t.mint) && isMeaningfulIncoming(t)
    );

    const paidSol = lamportsSpentBy(wallet, nt) > 0;
    const paidStable = spentStable(wallet, tt);
    const paid = swapUserHit || paidSol || paidStable;

    // Case 1: swap → incoming SPL + paid
    if (incoming.length && paid) {
      incoming.forEach((t:any)=> out.add(String(t.mint)));
    }

    // Case 2: bonding curve / pump → events.mint to recipient + paid
    const mintedEvts = asArray(tx?.events?.mint);
    if (paid && mintedEvts.length) {
      mintedEvts.forEach((m:any)=>{
        if (m?.recipient===wallet && m?.mint && !STABLE_AND_MAJORS.has(m.mint)) {
          out.add(String(m.mint));
        }
      });
    }

    // Case 3: type === 'SWAP' fallback
    if (tx?.type === 'SWAP' && !out.size) {
      tt.forEach((tr:any)=>{
        const to = tr?.toUserAccount || tr?.toUserAccountOwner;
        const from = tr?.fromUserAccount || tr?.fromUserAccountOwner;
        const mint = tr?.mint;
        if (mint && !STABLE_AND_MAJORS.has(mint) && to && eq(to, wallet) && (!from || !eq(from, wallet))) {
          out.add(mint);
        }
      });
    }
  } catch (e) {
    // keep silent, return what we have
  }
  return out;
}

export function intersectMany(sets: Set<string>[]): string[] {
  if (!sets.length) return [];
  let res = new Set([...sets[0]]);
  for (let i=1;i<sets.length;i++){
    res = new Set([...res].filter(x => sets[i].has(x)));
    if (!res.size) break;
  }
  return [...res];
}

/** Optional: Helius token metadata batch (you can call it if needed) */
export async function fetchTokenMetadata(mints: string[], apiKey: string): Promise<any[]> {
  if (!mints.length) return [];
  try {
    const res = await fetch(`https://api.helius.xyz/v0/tokens/metadata?api-key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mintAccounts: mints.slice(0,100) })
    });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}