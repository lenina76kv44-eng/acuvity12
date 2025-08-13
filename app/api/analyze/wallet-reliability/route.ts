import { env, okJson, badJson, asArray } from "@/lib/env";
import { fetchJsonRetry } from "@/lib/retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS = () => env("HELIUS_API_KEY");
const OPENAI = () => env("OPENAI_API_KEY");

async function heliusRpc(method: string, params: any[]) {
  const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS()}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ jsonrpc: "2.0", id: "bagsfinder", method, params })
  });
  const raw = await r.text();
  if (!r.ok) throw new Error(`Helius RPC ${r.status}: ${raw.slice(0,160)}`);
  const j = JSON.parse(raw);
  if (j.error) throw new Error(j.error.message || "Helius RPC error");
  return j.result;
}

async function fetchTxPages(address: string, pages: number, limit = 100) {
  const out:any[] = [];
  let before: string | undefined;
  for (let i=0;i<pages;i++){
    const u = new URL(`https://api.helius.xyz/v0/addresses/${address}/transactions`);
    u.searchParams.set("api-key", HELIUS());
    u.searchParams.set("limit", String(limit));
    if (before) u.searchParams.set("before", before);
    const arr = await fetchJsonRetry(u.toString(), { cache: "no-store" });
    if (!Array.isArray(arr) || !arr.length) break;
    out.push(...arr);
    before = arr[arr.length - 1]?.signature;
    if (!before) break;
  }
  return out;
}

export async function GET(req: Request) {
  if (!HELIUS()) return badJson("Missing HELIUS_API_KEY", 500);
  if (!OPENAI()) return badJson("Missing OPENAI_API_KEY", 500);

  const url = new URL(req.url);
  const address = (url.searchParams.get("address") || "").trim();
  const pages = Math.max(1, Math.min(10, parseInt(url.searchParams.get("pages") || "5", 10)));
  if (!address) return badJson("Missing ?address");

  try {
    const [txs, solLamports] = await Promise.all([
      fetchTxPages(address, pages, 100),
      heliusRpc("getBalance", [address])
    ]);
    const solBalance = typeof solLamports?.value === "number" ? solLamports.value / 1e9 : 
                       typeof solLamports === "number" ? solLamports / 1e9 : null;

    let firstSeen = Infinity, lastSeen = 0, swapCount = 0;
    const counterparties = new Set<string>();
    let bagsFeeClaims = 0;

    const STABLE = new Set([
      "So11111111111111111111111111111111111111112",
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
    ]);

    for (const tx of txs) {
      const t = Number(tx?.timestamp) || 0;
      if (t && t < firstSeen) firstSeen = t;
      if (t && t > lastSeen) lastSeen = t;
      if (tx?.events?.swap) swapCount++;

      const tt = asArray(tx?.tokenTransfers);
      tt.forEach((x:any)=>{
        if (x?.toUserAccount && x.toUserAccount !== address) counterparties.add(x.toUserAccount);
        if (x?.fromUserAccount && x.fromUserAccount !== address) counterparties.add(x.fromUserAccount);
        if (x?.toUserAccountOwner && x.toUserAccountOwner !== address) counterparties.add(x.toUserAccountOwner);
        if (x?.fromUserAccountOwner && x.fromUserAccountOwner !== address) counterparties.add(x.fromUserAccountOwner);
      });

      // Fee-claim heuristic: incoming non-stable token AND a known Bags program id
      const hasIncoming = tt.some((x:any)=> 
        (x?.toUserAccount === address || x?.toUserAccountOwner === address) && 
        x?.mint && !STABLE.has(x.mint)
      );
      const acctKeys = asArray(tx?.accountData).map((a:any)=> a?.account || a).filter(Boolean);
      const allIns = [
        ...(Array.isArray(tx?.instructions) ? tx.instructions : []),
        ...((Array.isArray(tx?.innerInstructions) ? tx.innerInstructions : [])
           .flatMap((ii: any) => Array.isArray(ii?.instructions) ? ii.instructions : [])),
      ];
      const programIds = allIns.map((ins:any) => ins?.programId).filter(Boolean);
      const hasBagsProgram = [...acctKeys, ...programIds].some((k:string)=> 
        /BAGS$/i.test(k) || /Axiom|dbcij3|cpamdp|troY36|6EF8rr/.test(k)
      );
      if (hasIncoming && hasBagsProgram) bagsFeeClaims++;
    }

    const now = Math.floor(Date.now()/1000);
    const ageDays = isFinite(firstSeen) ? Math.max(0, (now - firstSeen) / 86400) : null;

    const metrics = {
      txCount: txs.length,
      firstSeenTime: isFinite(firstSeen) ? firstSeen : null,
      lastSeenTime: lastSeen || null,
      ageDays: ageDays ? Math.round(ageDays * 10) / 10 : null,
      solBalance: solBalance ? Math.round(solBalance * 1000) / 1000 : null,
      swapCount,
      uniqueCounterparties: counterparties.size,
      bagsFeeClaims
    };

    // OpenAI — strict JSON
    const sys = `You are a Solana on-chain risk analyst. Given raw metrics, output JSON:
{ "score": 1-100, "rating": "Low|Medium|High Reliability", "bullets": string[3..6], "summary": string }.
Be conservative: low activity or little data => lower score. Consider ageDays, solBalance, txCount, swapCount, counterparties, bagsFeeClaims. Do not mention you are an AI.`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${OPENAI()}`
      },
      cache: "no-store",
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sys },
          { role: "user", content: JSON.stringify({ address, pages, metrics }) }
        ]
      })
    });
    const raw = await r.text();
    if (!r.ok) return badJson(`OpenAI ${r.status}: ${raw.slice(0,180)}`, 502);
    let ai;
    try { 
      const response = JSON.parse(raw);
      ai = JSON.parse(response.choices[0].message.content); 
    } catch { 
      return badJson(`OpenAI invalid JSON`, 502); 
    }

    return okJson({ ok: true, input: { address, pages }, metrics, ai });
  } catch (e: any) {
    return badJson(`Analysis failed: ${e.message || String(e)}`, 500);
  }
}