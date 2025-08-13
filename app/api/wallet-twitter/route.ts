import { NextResponse } from "next/server";
import { fetchJsonRetry } from "@/lib/retry";

export const runtime = "nodejs";
export const revalidate = 0;

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
const BAGS_API_KEY = process.env.BAGS_API_KEY || "";

// Default program IDs if not set in env
const DEFAULT_PROGRAM_IDS = [
  "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN",
  "AxiomfHaWDemCFBLBayqnEnNwE6b7B2Qz3UmzMpgbMG6", 
  "troY36YiPGqMyAYCNbEqYCdN2tb91Zf7bHcQt7KUi61",
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
  "cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG"
];

const asArray = (v: any) => Array.isArray(v) ? v : [];

function isValidBase58Wallet(wallet: string): boolean {
  if (!wallet || wallet.length < 32 || wallet.length > 48) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(wallet);
}

async function fetchHeliusTransactions(wallet: string, pages: number, limit: number) {
  const allTxs: any[] = [];
  let before: string | undefined;

  for (let page = 0; page < pages; page++) {
    const url = new URL(`https://api.helius.xyz/v0/addresses/${wallet}/transactions`);
    url.searchParams.set("api-key", HELIUS_API_KEY);
    url.searchParams.set("limit", String(limit));
    if (before) url.searchParams.set("before", before);

    try {
      const txs = await fetchJsonRetry(url.toString(), {
        cache: "no-store"
      });

      if (!Array.isArray(txs) || txs.length === 0) break;
      
      allTxs.push(...txs);
      before = txs[txs.length - 1]?.signature;
      if (!before) break;
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      break;
    }
  }

  return allTxs;
}

function extractBagsMints(txs: any[], programIds: string[]): string[] {
  const programSet = new Set(programIds);
  const mints = new Set<string>();

  for (const tx of txs) {
    // Check if transaction involves any of our program IDs
    const allInstructions = [
      ...asArray(tx?.instructions),
      ...asArray(tx?.innerInstructions).flatMap((ii: any) => asArray(ii?.instructions))
    ];

    const touchesBagsProgram = allInstructions.some((ins: any) => 
      programSet.has(ins?.programId)
    );

    if (touchesBagsProgram) {
      // Extract mints from token transfers that end with "BAGS"
      const tokenTransfers = asArray(tx?.tokenTransfers);
      for (const transfer of tokenTransfers) {
        const mint = transfer?.mint;
        if (mint && typeof mint === "string" && mint.endsWith("BAGS")) {
          mints.add(mint);
        }
      }
    }
  }

  return Array.from(mints);
}

async function fetchBagsCreators(mint: string) {
  const url = `https://public-api-v2.bags.fm/api/v1/token-launch/creator/v2?tokenMint=${encodeURIComponent(mint)}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        "x-api-key": BAGS_API_KEY,
        "accept": "application/json"
      },
      cache: "no-store"
    });

    const raw = await res.text();
    
    if (!res.ok) {
      throw new Error(`Bags API ${res.status}: ${raw.slice(0, 180)}`);
    }

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON from Bags: ${raw.slice(0, 180)}`);
    }

    return asArray(data?.response);
  } catch (error) {
    console.error(`Error fetching creators for ${mint}:`, error);
    return [];
  }
}

export async function GET(req: Request) {
  if (!HELIUS_API_KEY) {
    return NextResponse.json({ ok: false, error: "Missing HELIUS_API_KEY" }, { status: 500 });
  }
  
  if (!BAGS_API_KEY) {
    return NextResponse.json({ ok: false, error: "Missing BAGS_API_KEY" }, { status: 500 });
  }

  const url = new URL(req.url);
  const wallet = (url.searchParams.get("wallet") || "").trim();
  const pages = Math.max(1, Math.min(10, parseInt(url.searchParams.get("pages") || "5", 10)));
  const limit = Math.max(50, Math.min(100, parseInt(url.searchParams.get("limit") || "100", 10)));

  if (!isValidBase58Wallet(wallet)) {
    return NextResponse.json({ ok: false, error: "Invalid or missing ?wallet" }, { status: 400 });
  }

  try {
    // Get program IDs from env or use defaults
    const programIdsEnv = process.env.BAGS_PROGRAM_IDS || "";
    const programIds = programIdsEnv ? programIdsEnv.split(",").map(s => s.trim()) : DEFAULT_PROGRAM_IDS;

    // Fetch transactions from Helius
    const txs = await fetchHeliusTransactions(wallet, pages, limit);
    
    // Extract BAGS mints from relevant transactions
    const bagsMints = extractBagsMints(txs, programIds);
    
    if (bagsMints.length === 0) {
      return NextResponse.json({
        ok: true,
        wallet,
        twitters: [],
        creators: [],
        scanned: { pages, limitPerPage: limit, mintsChecked: 0 }
      });
    }

    // Fetch creator data for each mint
    const allCreators: any[] = [];
    const twitterSet = new Set<string>();

    for (const mint of bagsMints) {
      const creators = await fetchBagsCreators(mint);
      
      for (const creator of creators) {
        if (creator?.wallet === wallet && creator?.twitterUsername) {
          const twitter = creator.twitterUsername.toLowerCase();
          twitterSet.add(twitter);
          
          allCreators.push({
            mint,
            twitter,
            username: creator?.username || null,
            wallet: creator?.wallet || null,
            isCreator: !!creator?.isCreator,
            royaltyPct: typeof creator?.royaltyBps === "number" ? creator.royaltyBps / 100 : null
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      wallet,
      twitters: Array.from(twitterSet),
      creators: allCreators,
      scanned: { pages, limitPerPage: limit, mintsChecked: bagsMints.length }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      error: `Analysis failed: ${error?.message || String(error)}` 
    }, { status: 500 });
  }
}