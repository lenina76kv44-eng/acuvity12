import { env, okJson, badJson, asArray } from "@/lib/env";
import { fetchJsonRetry, fetchTextRetry, sleep } from "@/lib/retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS = () => env("HELIUS_API_KEY");

async function dasGetAsset(id: string) {
  const body = { jsonrpc: "2.0", id: "bagsfinder", method: "getAsset", params: { id } };
  const txt = await fetchTextRetry(`https://mainnet.helius-rpc.com/?api-key=${HELIUS()}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body)
  }, { retries: 2, timeoutMs: 15000 });
  try { return JSON.parse(txt)?.result ?? null; } catch { return null; }
}

async function scanTxs(mint: string, pages = 3, limit = 80) {
  const out: any[] = [];
  let before: string | undefined, lim = limit;
  for (let i=0;i<pages;i++) {
    const u = new URL(`https://api.helius.xyz/v0/addresses/${mint}/transactions`);
    u.searchParams.set("api-key", HELIUS()); u.searchParams.set("limit", String(lim));
    if (before) u.searchParams.set("before", before);
    try {
      const arr = await fetchJsonRetry<any[]>(u.toString(), {}, { retries: 3, timeoutMs: 20000 });
      if (!Array.isArray(arr) || arr.length===0) break;
      out.push(...arr);
      before = arr[arr.length-1]?.signature;
      await sleep(120);
    } catch (e:any) {
      const msg = String(e?.message||e);
      if (/429|502|503|504|timeout|aborted|socket/i.test(msg) && lim>50) { lim=Math.max(40,Math.floor(lim*0.7)); i--; await sleep(400); continue; }
      throw e;
    }
  }
  return out;
}

export async function GET(req: Request) {
  try {
    if (!HELIUS()) return badJson("Missing HELIUS_API_KEY", 500);
    const url = new URL(req.url);
    const ca = (url.searchParams.get("ca") || "").trim();
    if (!ca) return badJson("Provide ?ca=<token_mint>", 400);

    const asset = await dasGetAsset(ca);
    const creators = asArray(asset?.creators)
      .map((c:any)=>({ address: c?.address, share: c?.share ?? null }))
      .filter(x => x.address);

    const txs = await scanTxs(ca, 3, 80);
    const counter = new Map<string, number>();
    for (const tx of txs) {
      asArray(tx?.accountData).forEach((a:any)=>{
        if (a?.signer && a?.account) counter.set(a.account, (counter.get(a.account)||0)+1);
      });
    }
    const inferredTopSigners = [...counter.entries()]
      .sort((a,b)=>b[1]-a[1]).slice(0,5)
      .map(([address, hits]) => ({ address, hits }));

    return okJson({ ok: true, input: { ca }, creators, inferredTopSigners });
  } catch (e:any) {
    return badJson(`Fetch failed: ${e?.message || String(e)}`, 502);
  }
}