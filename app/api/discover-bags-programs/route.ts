import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Принудительно читаем переменную окружения
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "c8a64c85-a6ce-4c64-a1a3-ae2932d190fe";
const addrTx = (a: string, limit = 100, before?: string) =>
  `https://api.helius.xyz/v0/addresses/${a}/transactions?api-key=${HELIUS_API_KEY || ''}&limit=${limit}` +
  (before ? `&before=${before}` : "");

type ProgRow = { programId: string; count: number; labels: string[] };

export async function GET(req: Request) {
  try {
    if (!HELIUS_API_KEY) return NextResponse.json({ ok:false, error:"Missing HELIUS_API_KEY" }, { status:500 });

    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").trim();
    if (!wallet) return NextResponse.json({ ok:false, error:"Missing ?wallet" }, { status:400 });

    const PAGES = Number(url.searchParams.get("pages") || 5);
    const LIMIT = Number(url.searchParams.get("limit") || 100);
    const ONLY_MY_TX = url.searchParams.get("myTx") === "1";

    const stats = new Map<string, ProgRow>();
    let before: string | undefined;

    for (let p = 0; p < PAGES; p++) {
      const r = await fetch(addrTx(wallet, LIMIT, before));
      const raw = await r.text();
      if (!r.ok) return NextResponse.json({ ok:false, error:`${r.status}: ${raw.slice(0,200)}` }, { status:502 });

      let list: any[]; try { list = JSON.parse(raw); } catch { return NextResponse.json({ ok:false, error:`Invalid JSON: ${raw.slice(0,200)}` }, { status:502 }); }
      if (!Array.isArray(list) || list.length === 0) break;

      for (const tx of list) {
        if (ONLY_MY_TX) {
          const tts: any[] = Array.isArray(tx?.tokenTransfers) ? tx.tokenTransfers : [];
          const touchesMe = tts.some(tt =>
            String(tt?.toUserAccountOwner || "").toLowerCase() === wallet.toLowerCase() ||
            String(tt?.fromUserAccountOwner || "").toLowerCase() === wallet.toLowerCase()
          );
          if (!touchesMe) continue;
        }

        const allIns: any[] = [
          ...(Array.isArray(tx?.instructions) ? tx.instructions : []),
          ...((Array.isArray(tx?.innerInstructions) ? tx.innerInstructions : [])
             .flatMap((ii: any) => Array.isArray(ii?.instructions) ? ii.instructions : [])),
        ];

        for (const ins of allIns) {
          const pid = String(ins?.programId || "");
          if (!pid) continue;

          const name = (ins?.instructionName || ins?.type || ins?.parsed?.type || "").toString().toLowerCase();
          const labels: string[] = [];
          if (name.includes("claim") || name.includes("fee")) labels.push("fee");
          if (name.includes("launch") || name.includes("initialize") || name.includes("init")) labels.push("launch");

          const cur = stats.get(pid) || { programId: pid, count: 0, labels: [] };
          cur.count += 1;
          cur.labels = Array.from(new Set([...cur.labels, ...labels]));
          stats.set(pid, cur);
        }
      }

      before = String(list[list.length - 1]?.signature || "");
      if (!before) break;
    }

    const data = Array.from(stats.values()).sort((a, b) => b.count - a.count).slice(0, 20);
    return NextResponse.json({ ok:true, wallet, examinedPages: PAGES, limitPerPage: LIMIT, data });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || String(e) }, { status:500 });
  }
}