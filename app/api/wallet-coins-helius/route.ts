import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Принудительно читаем переменную окружения
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "c8a64c85-a6ce-4c64-a1a3-ae2932d190fe";
const addrTx = (a: string, limit = 100, before?: string) =>
  `https://api.helius.xyz/v0/addresses/${a}/transactions?api-key=${HELIUS_API_KEY || ''}&limit=${limit}` +
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
    
    const actorsCSV = (url.searchParams.get("actorIds") || process.env.BAGS_ACTOR_IDS || "").trim();
    const actorIds = actorsCSV.split(",").map(s => s.trim()).filter(Boolean);
    const ACTORS = actorIds.length ? new Set(actorIds) : null;

    const PAGES = Number(url.searchParams.get("pages") || 5);
    const LIMIT = Number(url.searchParams.get("limit") || 100);
    const MAX = Number(url.searchParams.get("max") || 200);
    const suffix = (url.searchParams.get("suffix") || process.env.BAGS_MINT_SUFFIX || "").trim();

    const out = new Map<string, Row>();
    const walletLower = wallet.toLowerCase();
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
        
        // матч по программам/акторам
        const matchedIns = flatIns.filter((ins: any) => {
          const pid = String(ins?.programId || "");
          if (pid && PROG.has(pid)) return true;
          const accs: string[] = Array.isArray(ins?.accounts) ? ins.accounts.map((a:any)=>String(a)) : [];
          return ACTORS && ACTORS.size ? accs.some(a => ACTORS.has(a)) : false;
        });
        if (!matchedIns.length) continue;

        // эвристики
        const insNames = matchedIns
          .map((ins:any) => (ins?.instructionName || ins?.type || ins?.parsed?.type || "").toString().toLowerCase())
          .join(" ");

        const hasClaimOp =
          /claim|fee/.test(insNames) ||
          (Array.isArray(tx?.logMessages) && tx.logMessages.some((m:any)=>/claim|fee/i.test(String(m))));

        const hasBagActor = ACTORS && ACTORS.size
          ? matchedIns.some((ins:any) => (Array.isArray(ins?.accounts) ? ins.accounts.map((a:any)=>String(a)) : []).some((a:string)=>ACTORS.has(a)))
          : false;

        const isSwapByMe =
          !!(tx?.events?.swap && typeof tx.events.swap?.user === "string" && tx.events.swap.user.toLowerCase() === walletLower);

        // обрабатываем только входящие токены И (claim/fee или signer), и без swap
        const tokenTransfers: any[] = Array.isArray(tx?.tokenTransfers) ? tx.tokenTransfers : [];
        let minted = 0;

        for (const tt of tokenTransfers) {
          const mint = String(tt?.mint || "");
          if (!mint) continue;

          const toMe =
            String(tt?.toUserAccountOwner || "").toLowerCase() === walletLower ||
            String(tt?.toUserAccount || "").toLowerCase() === walletLower;

          // строгий фильтр: уходят покупки/свопы
          if (!toMe) continue;
          if (!hasClaimOp && !hasBagActor) continue;
          if (isSwapByMe) continue;

          const role: Row["role"] = matchedIns.some((ins:any)=>/launch|initialize|init/.test(
            String(ins?.instructionName || ins?.type || ins?.parsed?.type || "").toLowerCase()
          )) ? "launch" : "fee-claim";

          const firstProg = matchedIns.map((i:any)=>String(i?.programId||"")).find((pid)=>pid && PROG.has(pid)) || null;
          upsert(out, mint, { mint, role, tx: sig, time: ts, programId: firstProg });
          minted++;
        }

        // fallback: допускаем launch без transfers (редко)
        if (!minted && /launch|initialize|init/.test(insNames)) {
          for (const ins of matchedIns) {
            const accounts: string[] = (Array.isArray(ins?.accounts) ? ins.accounts : []).map((a:any)=>String(a));
            for (const acc of accounts) {
              if (acc.length >= 32 && acc.length <= 44) {
                upsert(out, acc, { mint: acc, role: "launch", tx: sig, time: ts, programId: String(ins?.programId || "") || null });
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
      data = data.filter(r => typeof r.mint === "string" && r.mint.toUpperCase().endsWith(suffix.toUpperCase()));
    }
    
    return NextResponse.json({ ok:true, wallet, programIds, actorIds, found: data.length, data });
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