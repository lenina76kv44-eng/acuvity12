"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#00ff88] to-[#00cc6a] bg-clip-text text-transparent mb-4">
            Welcome to Bags Finder
          </h1>
          <p className="text-[#888888] mt-2 text-base max-w-2xl mx-auto font-medium">
            Find wallet mappings by Twitter handle or discover creators by token contract address
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          <TwitterToWalletCard />
          <CaToCreatorsCard />
        </section>

        <footer className="text-center text-sm text-[#666666] border-t border-[#1a1a1a] pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <a 
                href="https://x.com/BagsDox" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transform hover:scale-110 hover:rotate-3 transition-all duration-300 ease-out"
              >
                <img 
                  src="https://i.imgur.com/cZDrW7C.png" 
                  alt="X (Twitter)" 
                  className="w-12 h-12 rounded object-contain"
                />
              </a>
              <a 
                href="https://bags.fm" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity duration-200"
              >
                <img 
                  src="https://i.imgur.com/gzT11Ng.png" 
                  alt="Bags.fm" 
                  className="w-48 h-16 rounded object-contain"
                />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function TwitterToWalletCard() {
  const [handle, setHandle] = useState("");
  const [wallet, setWallet] = useState<string | null>(null);
  const [sol, setSol] = useState<number | null>(null);
  const [hCoins, setHCoins] = useState<any[]>([]);
  const [hLoading, setHLoading] = useState(false);
  const [hError, setHError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      
      // Filter out noise
      const EXCLUDE = new Set([
        "So11111111111111111111111111111111111111112", // wSOL
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
      ]);
      
      const cleaned = (Array.isArray(j.data) ? j.data : [])
        .filter((r: any) => r.role !== "program-match")
        .filter((r: any) => !EXCLUDE.has(r.mint));
      
      setHCoins(cleaned);
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
      // 1) Twitter → Wallet
      const j = await fetchJson(`/api/twitter-wallet?handle=${encodeURIComponent(clean)}`);
      if (!j.ok) throw new Error(j.error || "Request failed");
      const addr = j.wallet || null;
      setWallet(addr);
      if (!addr) { setError("No wallet mapping found for this handle."); return; }

      // 2) Load balance and Helius coins
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
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-[0_0_0_1px_rgba(16,185,129,0.02)]">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-green-300 mb-2">Twitter → Wallet</h2>
        <p className="text-green-300/70 text-sm leading-relaxed">
          Enter a Twitter handle to get the mapped wallet from Bags and SOL balance.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="@creator"
            className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-green-100 placeholder:text-green-300/50 outline-none focus:ring-2 focus:ring-green-600"
          />
          <button
            onClick={findWallet}
            disabled={loading || !handle.trim()}
            className="rounded-xl bg-green-600 text-black px-5 py-3 font-medium hover:bg-green-500 active:bg-green-600 disabled:opacity-50"
          >
            {loading ? "Finding..." : "Find"}
          </button>
        </div>

        {error && (
          <div className="text-red-400 mt-3">{error}</div>
        )}

        {wallet && (
          <div className="mt-4 space-y-4">
            {/* Адрес */}
            <div>
              <div className="text-sm text-green-300/70">Mapped wallet</div>
              <div className="mt-1 font-mono break-all bg-black/50 border border-neutral-800 rounded-xl p-3">
                {wallet}
              </div>
            </div>

            {/* Баланс */}
            <div>
              <div className="text-sm text-green-300/70 flex items-center gap-2">
                Balance
                <img 
                  src="https://i.imgur.com/X5Fsrnb.png" 
                  alt="SOL" 
                  className="w-4 h-4"
                />
              </div>
              <div className="mt-1 font-mono bg-black/50 border border-neutral-800 rounded-xl p-3 inline-block">
                {sol != null ? `${sol} SOL` : "—"}
              </div>
            </div>

            {/* Coins (Helius) */}
            <div>
              <div className="text-sm text-green-300/70 mb-2">
                BAGS Tokens (mint ending with "BAGS")
              </div>

              {hLoading && <div className="text-green-300/60 text-xs">Scanning transactions...</div>}
              {hError && <div className="text-red-400 text-xs">{hError}</div>}

              {!hLoading && !hError && (
                hCoins.length ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <div className="text-xs text-green-300/60 mb-2">
                      Found {hCoins.length} BAGS tokens (fee-claim/launch)
                    </div>
                    {hCoins.map((c, i) => (
                      <div key={i} className="rounded-xl border border-neutral-800 bg-black/50 p-3">
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <span className={
                            "px-2 py-0.5 rounded-full border font-medium " +
                            (c.role === "launch"
                              ? "bg-green-500/10 border-green-500/30 text-green-400"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-300")
                          }>
                            {c.role === "launch" ? "Launch" : "Fee-claim"}
                          </span>
                          <span className="ml-auto text-neutral-400">
                            {c.time ? new Date(c.time * 1000).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <a
                            href={`https://bags.fm/${c.mint}`}
                            target="_blank" rel="noopener noreferrer"
                            className="block font-mono text-xs underline decoration-green-600/40 hover:decoration-green-400 break-all text-green-100"
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
                  </div>
                ) : (
                  <div className="text-green-300/60 text-xs">No BAGS tokens detected.</div>
                )
              )}
            </div>
          </div>
        )}

        {!error && !wallet && !loading && (
          <div className="text-green-300/60 mt-4 text-xs">Enter a handle and press Find.</div>
        )}
      </div>
    </div>
  );
}

function CaToCreatorsCard() {
  const [ca, setCa] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchCreators() {
    setLoading(true); setError(""); setRows([]);
    const clean = ca.trim();
    
    // Light base58 sanity check
    if (clean.length < 32 || clean.length > 44) {
      setError("Invalid CA format");
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/token-creators?ca=${encodeURIComponent(clean)}`);
      const raw = await res.text();
      const p = parseJsonSafe(raw);
      if (!p.ok) throw new Error(p.error);
      const j = p.data;
      if (!j.ok) throw new Error(j.error || "Request failed");
      
      const creators = (Array.isArray(j.data) ? j.data : []).map((c: any) => ({
        username: c?.username ?? null,
        twitter: c?.twitterUsername ?? null,
        wallet: c?.wallet ?? null,
        royaltyPct: typeof c?.royaltyBps === "number" ? c.royaltyBps / 100 : null,
        isCreator: !!c?.isCreator,
        pfp: c?.pfp ?? null,
      }));
      
      setRows(creators);
      if (!creators.length) setError("No creators found for this CA.");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && ca.trim() && !loading) {
      fetchCreators();
    }
  };

  return (
    <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] hover:bg-[#151515] transition-all duration-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Token CA → Creators</h2>
        <p className="text-[#888888] text-sm leading-relaxed">
          Enter a token contract address to discover creators and fee shares
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            value={ca}
            onChange={(e) => setCa(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Contract address"
            className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-white px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#00ff88] focus:border-[#00ff88] transition-all duration-200 placeholder-[#666666] font-medium"
          />
          <button
            onClick={fetchCreators}
            disabled={loading || !ca.trim()}
            className="rounded-lg bg-[#00ff88] hover:bg-[#00cc6a] text-black px-6 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-w-[80px] text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ...
              </span>
            ) : "Find"}
          </button>
        </div>

        {error && (
          <div className="bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-lg p-3">
            <p className="text-[#ff6666] text-sm font-medium">{error}</p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#888888] mb-3 uppercase tracking-wide">
              Found {rows.length} creator{rows.length !== 1 ? 's' : ''}
            </div>
            {rows.map((c, i) => (
              <div key={i} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#1f1f1f] transition-colors duration-200 p-4">
                <div className="flex items-center gap-4 mb-4">
                  {c.pfp ? (
                    <img 
                      src={c.pfp} 
                      alt={c.username || "User"} 
                      className="w-10 h-10 rounded-lg object-cover border border-[#2a2a2a]" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#666666]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm">
                      {c.username || "Unknown User"}
                    </div>
                    {c.twitter && (
                      <div className="text-xs text-[#888888]">@{c.twitter}</div>
                    )}
                  </div>
                  <div className={`text-xs rounded-full px-2 py-1 font-semibold border ${c.isCreator ? "bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]" : "bg-[#4488ff]/10 border-[#4488ff]/20 text-[#4488ff]"}`}>
                      {c.isCreator ? "Creator" : "Fee Share"}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[#666666] font-semibold mb-1 uppercase tracking-wide">Wallet</div>
                    <div className="font-mono text-xs break-all bg-[#0a0a0a] border border-[#2a2a2a] rounded-md p-2 text-[#cccccc]">
                      {c.wallet || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#666666] font-semibold mb-1 uppercase tracking-wide">Royalty</div>
                    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-md p-2 text-[#cccccc] font-medium">
                      {c.royaltyPct != null ? `${c.royaltyPct}%` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && !rows.length && !loading && (
          <div className="text-center py-8">
            <div className="text-[#666666] text-sm">Enter a contract address and press Find to get started</div>
          </div>
        )}
      </div>
    </div>
  );
}