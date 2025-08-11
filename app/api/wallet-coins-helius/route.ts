import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HELIUS = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ""}`;

async function rpc(method: string, params: any) {
  if (!process.env.HELIUS_API_KEY) throw new Error("Missing HELIUS_API_KEY");
  const r = await fetch(HELIUS, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "bags", method, params }),
  });
  const raw = await r.text();
  if (!r.ok) throw new Error(`${r.status}: ${raw.slice(0,200)}`);
  let j: any; try { j = JSON.parse(raw); } catch { throw new Error(`Invalid JSON: ${raw.slice(0,200)}`); }
  if (j.error) throw new Error(j.error.message || "RPC error");
  return j.result;
}

const asItems = (res: any) =>
  Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const wallet = (url.searchParams.get("wallet") || "").trim();
    if (!wallet) return NextResponse.json({ ok:false, error:"Missing ?wallet" }, { status:400 });

    // 1) Активы, где адрес указан как creator (фанджиблы)
    let itemsCreator: any[] = [];
    try {
      const s = await rpc("searchAssets", { creatorAddress: wallet, page: 1, limit: 500 });
      itemsCreator = asItems(s);
    } catch { itemsCreator = []; } // если версия/параметр не поддержан — просто пропустим

    // 2) Активы, где адрес — update authority
    let itemsAuthority: any[] = [];
    try {
      const s = await rpc("getAssetsByAuthority", { authorityAddress: wallet, page: 1, limit: 500 });
      itemsAuthority = asItems(s);
    } catch { itemsAuthority = []; }

    const all = [...itemsCreator, ...itemsAuthority];
    const seen = new Set<string>();
    const out: Array<{ mint: string; name: string | null; symbol: string | null; image?: string | null; role: "creator" | "authority" | "unknown" }> = [];

    for (const a of all) {
      // фильтруем на фанджиблы
      const iface = a?.interface || a?.interfaceType;
      if (iface && iface !== "FungibleToken") continue;

      const mint = a?.id || a?.mint || a?.token?.mint;
      if (!mint || seen.has(mint)) continue;

      // поля из разных версий DAS
      const creators = (a?.creators || a?.content?.metadata?.creators || [])
        .map((c: any) => c?.address || c).filter(Boolean);
      const authority =
        a?.authorities?.[0]?.address ||
        a?.authority ||
        a?.updateAuthority ||
        null;

      let role: "creator" | "authority" | "unknown" = "unknown";
      if (creators.includes(wallet)) role = "creator";
      else if (authority === wallet) role = "authority";

      out.push({
        mint,
        name: a?.content?.metadata?.name ?? a?.token_info?.name ?? null,
        symbol: a?.token_info?.symbol ?? a?.content?.metadata?.symbol ?? null,
        image: a?.content?.links?.image ?? null,
        role,
      });
      seen.add(mint);
    }

    // Сначала creator, потом authority, затем unknown
    out.sort((a, b) => {
      const rank = (r: string) => (r === "creator" ? 0 : r === "authority" ? 1 : 2);
      return rank(a.role) - rank(b.role);
    });

    return NextResponse.json({ ok: true, data: out });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || String(e) }, { status:500 });
  }
}