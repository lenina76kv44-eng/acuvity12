import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
const addrTx = (a: string, limit = 100, before?: string) =>
  `https://api.helius.xyz/v0/addresses/${a}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}` +
  (before ? `&before=${before}` : "");

type Row = { mint: string; role: "launch" | "fee-claim" | "program-match"; tx: string; time?: number|null; programId?: string|null };

export async function GET(req: Request) {
  try {
    if (!HELIUS_API_KEY) return NextResponse.json({ ok:false, error:"Missing HELIUS_API_KEY" }, { status:500 });

    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").trim();
    if (!wallet) return NextResponse.json({ ok:false, error:"Missing ?wallet" }, { status:400 });

    const programsCSV = (url.searchParams.get("programIds") || process.env.BAGS_PROGRAM_IDS || "").trim();
    const programIds = programsCSV.split(",").map(s => s.trim()).filter(Boolean);
    if (!programIds.length) {
      return NextResponse.json({ ok:false, error:"Provide ?programIds=a,b or set BAGS_PROGRAM_IDS" }, { status:400 });
    }
    const PROG = new Set(programIds);

    const PAGES = Number(url.searchParams.get("pages") || 5);
    const LIMIT = Number(url.searchParams.get("limit") || 100);
    const MAX = Number(url.searchParams.get("max") || 200);
    const suffix = (url.searchParams.get("suffix") || "").trim();

    const out = new Map<string, Row>();
    let before: string | undefined;

    for (let p = 0; p < PAGES; p++) {
      const r = await fetch(addrTx(wallet, LIMIT, before));
      const raw = await r.text();
      if (!r.ok) return NextResponse.json({ ok:false, error:`${r.status}: ${raw.slice(0,200)}` }, { status:502 });

      let list: any[]; try { list = JSON.parse(raw); } catch { return NextResponse.json({ ok:false, error:`Invalid JSON: ${raw.slice(0,200)}` }, { status:502 }); }
      if (!Array.isArray(list) || list.length === 0) break;

      for (const tx of list) {
        const sig: string = tx?.signature || tx?.id || "";
        const ts: number | null = typeof tx?.timestamp === "number" ? tx.timestamp : null;

        const flatIns: any[] = [
          ...(Array.isArray(tx?.instructions) ? tx.instructions : []),
          ...((Array.isArray(tx?.innerInstructions) ? tx.innerInstructions : [])
             .flatMap((ii: any) => Array.isArray(ii?.instructions) ? ii.instructions : [])),
        ];
        const matched = flatIns.filter((ins: any) => PROG.has(String(ins?.programId || "")));
        if (!matched.length) continue;

        const looksLaunch = matched.some((ins: any) => {
          const t = (ins?.instructionName || ins?.type || ins?.parsed?.type || "").toString().toLowerCase();
          return t.includes("launch") || t.includes("initialize") || t.includes("init");
        });

        const tokenTransfers: any[] = Array.isArray(tx?.tokenTransfers) ? tx.tokenTransfers : [];
        let minted = 0;

        for (const tt of tokenTransfers) {
          const mint = String(tt?.mint || "");
          if (!mint) continue;

          const toMe =
            String(tt?.toUserAccountOwner || "").toLowerCase() === wallet.toLowerCase() ||
            String(tt?.toUserAccount || "").toLowerCase() === wallet.toLowerCase();

          const role: Row["role"] = looksLaunch ? "launch" : (toMe ? "fee-claim" : "program-match");
          upsert(out, mint, { mint, role, tx: sig, time: ts, programId: matched[0]?.programId || null });
          minted++;
        }

        if (!minted && looksLaunch) {
          for (const ins of matched) {
            for (const acc of (ins?.accounts || [])) {
              const a = String(acc || "");
              if (a.length >= 32 && a.length <= 44) {
                upsert(out, a, { mint: a, role: "launch", tx: sig, time: ts, programId: ins?.programId || null });
              }
            }
          }
        }

        if (out.size >= MAX) break;
      }

      before = String(list[list.length - 1]?.signature || "");
      if (!before || out.size >= MAX) break;
    }

    let data = Array.from(out.values()).sort((a, b) => rank(a.role) - rank(b.role) || (b.time || 0) - (a.time || 0));
    
    // Фильтр по суффиксу mint (например, "BAGS")
    if (suffix) {
      data = data.filter(r => typeof r.mint === "string" && r.mint.endsWith(suffix));
    }
    
    return NextResponse.json({ ok:true, wallet, programIds, found: data.length, data });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || String(e) }, { status:500 });
  }
}

function rank(r: Row["role"]) { return r === "launch" ? 0 : r === "fee-claim" ? 1 : 2; }
function upsert(map: Map<string, Row>, mint: string, row: Row) {
  const prev = map.get(mint);
  if (!prev) { map.set(mint, row); return; }
  if (rank(row.role) < rank(prev.role)) map.set(mint, { ...prev, ...row });
}