"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

export default function TwitterSearchPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">X to Wallet Search</h1>
          <p className="text-[#888888] text-base">
            Enter an X handle to find the wallet and discover BAGS tokens
          </p>
        </header>

        <div className="max-w-2xl">
          <XToWalletCard />
        </div>
      </div>
    </main>
  );
}

function XToWalletCard() {
  const [handle, setHandle] = useState("");
  const [wallet, setWallet] = useState<string | null>(null);
  const [sol, setSol] = useState<number | null>(null);
  const [hCoins, setHCoins] = useState<any[]>([]);
  const [hLoading, setHLoading] = useState(false);
  const [hError, setHError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function enrichWithMeta(rows: any[]) {
    const mints = Array.from(new Set(rows.map(r => r.mint).filter(Boolean)));
    if (!mints.length) return rows;

    const res = await fetch("/api/token-meta", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mints }),
    });
    const j = await res.json();
    const map = j?.data || {};
    return rows.map(r => ({ ...r, meta: map[r.mint] || null }));
  }

  async function fetchJson(url: string) {
    const res = await fetch(url);
    const raw = await res.text();
    const p = parseJsonSafe(raw);
    if (!p.ok) throw new Error(p.error);
    return p.data;
  }

  async function loadWalletOverview(addr: string) {
    const j = await fetchJson(`/api/wallet-overview?address=${encodeURIComponent(addr)}`);
    if (!j.ok) throw new Error(j.error || "Overview failed");
    setSol(typeof j.solBalance === "number" ? j.solBalance : null);
  }

  async function loadHeliusCoins(addr: string) {
    try {
      setHLoading(true); setHError(""); setHCoins([]);
      const res = await fetch(`/api/wallet-coins-helius?wallet=${encodeURIComponent(addr)}&suffix=BAGS`);
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || "Helius scan failed");
      
      const EXCLUDE = new Set([
        "So11111111111111111111111111111111111111112",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      ]);
      
      const cleaned = (Array.isArray(j.data) ? j.data : [])
        .filter((r: any) => r.role !== "program-match")
        .filter((r: any) => !EXCLUDE.has(r.mint));
      
      const enriched = await enrichWithMeta(cleaned);
      setHCoins(enriched);
    } catch (e: any) {
      setHError(e.message || String(e));
    } finally {
      setHLoading(false);
    }
  }

  async function findWallet() {
    setLoading(true); setError("");
    setWallet(null); setSol(null); setHCoins([]);
    setHError("");

    const clean = handle.trim().replace(/^@/, "").toLowerCase();
    try {
      const j = await fetchJson(`/api/twitter-wallet?handle=${encodeURIComponent(clean)}`);
      if (!j.ok) throw new Error(j.error || "Request failed");
      const addr = j.wallet || null;
      setWallet(addr);
      if (!addr) { setError("Couldn't find it this time."); return; }

      await Promise.all([
        loadWalletOverview(addr),
        loadHeliusCoins(addr),
      ]);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && handle.trim() && !loading) {
      findWallet();
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 find-glow find-hover">
      <div className="space-y-4">
        <div className="flex gap-3">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="@handle_on_x"
            className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-green-100 placeholder:text-green-300/50 outline-none focus:ring-2 focus:ring-green-600"
          />
          <button
            onClick={findWallet}
            disabled={loading || !handle.trim()}
            className="rounded-xl bg-green-600 text-black px-5 py-3 font-semibold hover:bg-green-500 active:bg-green-600 disabled:opacity-50 shadow-[0_0_0_1px_rgba(0,255,136,.2)] hover:shadow-[0_10px_30px_rgba(0,255,136,.15)] transition-all duration-200"
          >
            {loading ? "Finding…" : "Find"}
          </button>
        </div>

        {error && (
          <div className="text-red-400 mt-3">{error}</div>
        )}

        {wallet && (
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-[#7AEFB8] font-semibold">Mapped Wallet</div>
              <div className="mt-1 font-mono break-all bg-black/50 border border-neutral-800 rounded-xl p-3">
                {wallet}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-[#7AEFB8] font-semibold flex items-center gap-2">
                Balance
                <img 
                  src="https://i.imgur.com/X5Fsrnb.png" 
                  alt="SOL" 
                  className="w-4 h-4"
                />
              </div>
              <div className="mt-1 font-mono bg-black/50 border border-neutral-800 rounded-xl p-3 inline-block text-sm">
                {sol != null ? `${sol} SOL` : "—"}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-[#7AEFB8] font-semibold mb-2">
                Coins — Found by Helius
              </div>

              {hLoading && <div className="text-green-300/60 text-xs">Finding…</div>}
              {hError && <div className="text-red-400 text-xs">Find failed. Try again.</div>}

              {!hLoading && !hError && (
                hCoins.length ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <div className="text-xs text-green-300/60 mb-2">
                      Found {hCoins.length} BAGS tokens
                    </div>
                    {hCoins.slice(0, 15).map((c, i) => (
                      <div key={i} className="rounded-xl border border-neutral-800 bg-black/50 p-3">
                        <div className="flex items-center gap-3 mb-3">
                          {c?.meta?.image ? (
                            <img
                              src={c.meta.image}
                              alt={c.meta.name || c.mint}
                              className="w-8 h-8 rounded-lg border border-neutral-700 object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg border border-neutral-700 bg-neutral-800 flex-shrink-0" />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-green-100">
                              {c?.meta?.name || `${c.mint.slice(0,4)}…${c.mint.slice(-4)}`}
                            </div>
                            <div className="text-xs text-neutral-400">
                              {c?.meta?.symbol || "—"}
                            </div>
                          </div>
                          
                          <span className={
                            "px-2 py-1 rounded-full border font-medium text-xs flex-shrink-0 " +
                            (c.role === "launch"
                              ? "bg-green-500/10 border-green-500/30 text-green-400"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-300")
                          }>
                            {c.role === "launch" ? "Find: Launch" : "Find: Fee-claim"}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs text-neutral-400 mb-1">
                            {c.time ? new Date(c.time * 1000).toLocaleDateString() : ""}
                          </div>
                          <a
                            href={`https://bags.fm/${c.mint}`}
                            target="_blank" rel="noopener noreferrer"
                            className="block font-mono text-xs underline decoration-green-600/40 hover:decoration-green-400 break-all text-green-200"
                          >
                            {c.mint}
                          </a>
                          <div className="text-xs text-neutral-500">
                            tx: <a
                              href={`https://solscan.io/tx/${c.tx}`}
                              target="_blank" rel="noopener noreferrer"
                              className="underline decoration-neutral-600 hover:decoration-neutral-400"
                            >
                              {c.tx.slice(0, 8)}…{c.tx.slice(-8)}
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                    {hCoins.length > 15 && (
                      <div className="text-xs text-green-300/60 text-center py-2">
                        Showing first 15 of {hCoins.length} tokens
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-green-300/60 text-xs">Nothing to find yet.</div>
                )
              )}
            </div>
          </div>
        )}

        {!error && !wallet && !loading && (
          <div className="text-green-300/60 mt-4 text-xs">Type an X handle and press Find.</div>
        )}
      </div>
    </div>
  );
}