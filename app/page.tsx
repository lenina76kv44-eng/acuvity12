"use client";
import { useState } from "react";

const API_BASE = "https://public-api-v2.bags.fm/api/v1";
const API_KEY = "bags_prod_WLmpt-ZMCdFmN3WsFBON5aJnhYMzkwAUsyIJLZ3tORY";

async function bagsApi(path: string) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 
        "x-api-key": API_KEY, 
        "accept": "application/json" 
      },
    });
    const raw = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${raw.slice(0,200)}` };
    try { 
      return { ok: true, json: JSON.parse(raw) }; 
    } catch { 
      return { ok: false, error: `Invalid JSON: ${raw.slice(0,200)}` }; 
    }
  } catch (e: any) {
    return { ok: false, error: `Fetch failed: ${String(e?.message || e)}` };
  }
}

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-16 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="https://i.imgur.com/KQRAG1D.png" 
              alt="Bags Finder Logo" 
              className="w-12 h-12 rounded-lg"
            />
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#00ff88] to-[#00cc6a] bg-clip-text text-transparent">
              Bags Finder
            </h1>
          </div>
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
            <p>Powered by Bags.fm API</p>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function findWallet() {
    setLoading(true); setError(""); setWallet(null);
    const clean = handle.trim().replace(/^@/, "").toLowerCase();
    
    // Validate Twitter handle
    if (!/^[a-z0-9_]{1,15}$/.test(clean)) {
      setError("Invalid Twitter handle");
      setLoading(false);
      return;
    }
    
    try {
      const r = await bagsApi(`/token-launch/fee-share/wallet/twitter?twitterUsername=${encodeURIComponent(clean)}`);
      if (!r.ok) throw new Error(r.error);
      
      const wallet = r.json?.response ?? null;
      setWallet(wallet);
      if (!wallet) setError("No wallet mapping found for this handle.");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && handle.trim() && !loading) {
      findWallet();
    }
  };

  return (
    <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] hover:bg-[#151515] transition-all duration-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Twitter → Wallet</h2>
        <p className="text-[#888888] text-sm leading-relaxed">
          Enter a Twitter handle to find the mapped wallet address
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="@creator"
            className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-white px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#00ff88] focus:border-[#00ff88] transition-all duration-200 placeholder-[#666666] font-medium"
          />
          <button
            onClick={findWallet}
            disabled={loading || !handle.trim()}
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

        {wallet && (
          <div className="bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-lg p-3">
            <div className="text-xs font-semibold text-[#00ff88] mb-2 uppercase tracking-wide">Wallet Address</div>
            <div className="font-mono text-sm break-all bg-[#0a0a0a] border border-[#2a2a2a] rounded-md p-3 text-white">
              {wallet}
            </div>
          </div>
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
    if (clean.length < 32 || clean.length > 48) {
      setError("Invalid CA format");
      setLoading(false);
      return;
    }
    
    try {
      const r = await bagsApi(`/token-launch/creator/v2?tokenMint=${encodeURIComponent(clean)}`);
      if (!r.ok) throw new Error(r.error);
      
      const creators = (Array.isArray(r.json?.response) ? r.json.response : []).map((c: any) => ({
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
            onKeyPress={handleKeyPress}
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