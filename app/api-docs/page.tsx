'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

const BRAND_GRAD = 'bg-gradient-to-r from-[#00ff88] to-[#00cc6a]';
const BORDER = 'border border-[#1a1a1a]';
const CARD = `rounded-2xl ${BORDER} bg-[#0d0d0d] p-6 shadow-[0_0_0_1px_rgba(0,255,136,0.04)] hover:shadow-[0_10px_30px_rgba(0,255,136,0.08)] transition-all`;

type Lang = 'js' | 'ts' | 'py';

function Tabs({
  value, onChange,
}: { value: Lang; onChange: (v: Lang) => void }) {
  const btn = 'px-3 py-1.5 rounded-md text-xs font-semibold';
  const active = 'bg-[#00ff88] text-black';
  const idle = 'bg-[#121212] text-[#b5f5d6] hover:bg-[#171717]';
  return (
    <div className="inline-flex gap-1">
      <button className={`${btn} ${value === 'js' ? active : idle}`} onClick={() => onChange('js')}>JavaScript</button>
      <button className={`${btn} ${value === 'ts' ? active : idle}`} onClick={() => onChange('ts')}>TypeScript</button>
      <button className={`${btn} ${value === 'py' ? active : idle}`} onClick={() => onChange('py')}>Python</button>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="relative animate-slide-in-up">
      <button
        onClick={copy}
        className="absolute right-3 top-3 text-xs px-2.5 py-1 rounded-md bg-[#121212] text-[#c7ffe7] hover:bg-[#171717] border border-[#1f1f1f] btn-animated"
      >
        {copied ? (
          <span className="animate-bounce-in">✓ Copied</span>
        ) : 'Copy'}
      </button>
      <pre className="overflow-x-auto rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] p-4 text-[12.5px] leading-5 text-[#d7ffe9]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({
  title, subtitle, params, snippets,
}: {
  title: string;
  subtitle: string;
  params: Array<{ name: string; req?: boolean; desc: string }>;
  snippets: { js: string; ts: string; py: string };
}) {
  const [lang, setLang] = useState<Lang>('js');
  const code = useMemo(() => snippets[lang], [snippets, lang]);

  return (
    <section className={`${CARD} animate-slide-in-up`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">{title}</h2>
          <p className="text-[#9feecf] text-sm mt-1">{subtitle}</p>
        </div>
        <Tabs value={lang} onChange={setLang} />
      </div>

      <div className="mb-4 overflow-x-auto">
        <table className="w-full text-left text-sm border-separate border-spacing-y-1">
          <thead>
            <tr className="text-[#85eabb]">
              <th className="pr-6">Param</th>
              <th className="pr-6">Req</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {params.map((p, i) => (
              <tr key={i} className="text-[#baf7dc]">
                <td className="pr-6 font-mono">{p.name}</td>
                <td className="pr-6">{p.req ? 'Yes' : 'No'}</td>
                <td className="opacity-80">{p.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CodeBlock code={code} />
    </section>
  );
}

export default function ApiDocsPage() {
  const BASE_HINT = typeof window === 'undefined' ? '' : window.location.origin;

  // --- Code Snippets (realistic, short, and pretty) ---
  const s_x2w = {
    js: `// JavaScript (fetch, browser or Node 18+)
const base = (typeof window !== 'undefined' ? '' : 'https://your-domain.tld');
async function xToWallet(tag) {
  const handle = String(tag).replace(/^@/, '');
  const r = await fetch(\`\${base}/api/twitter-wallet?handle=\${encodeURIComponent(handle)}\`);
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // => { ok: true, wallet: "..." } or { ok:false, error:"..." }
}
xToWallet('BagsDox').then(console.log).catch(console.error);`,

    ts: `// TypeScript (fetch)
type TwitterWalletResp = { ok: boolean; wallet?: string|null; error?: string };
export async function xToWallet(handle: string, base = ''): Promise<TwitterWalletResp> {
  handle = handle.replace(/^@/, '');
  const res = await fetch(\`\${base}/api/twitter-wallet?handle=\${encodeURIComponent(handle)}\`);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<TwitterWalletResp>;
}
// Usage:
xToWallet('BagsDox').then(r => console.log(r.wallet));`,

    py: `# Python (requests)
import requests
BASE = ''  # set to 'https://your-domain.tld' if calling from backend script
def x_to_wallet(tag: str):
    h = tag.lstrip('@')
    r = requests.get(f"{BASE}/api/twitter-wallet", params={'handle': h})
    r.raise_for_status()
    return r.json()  # { ok, wallet, error? }

print(x_to_wallet('BagsDox'))`,
  };

  const s_creators = {
    js: `// JavaScript — Token creators/fee-shares by mint (CA)
async function tokenCreators(ca) {
  const r = await fetch(\`/api/token-creators?ca=\${encodeURIComponent(ca)}\`);
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { ok:true, data:[{ username, twitterUsername, wallet, royaltyPct, isCreator, pfp }]}
}
tokenCreators('So11111111111111111111111111111111111111112').then(console.log);`,

    ts: `// TypeScript — creators by CA
type CreatorRow = {
  username: string|null; twitterUsername: string|null; wallet: string|null;
  royaltyPct: number|null; isCreator: boolean; pfp: string|null;
};
type CreatorsResp = { ok: boolean; data: CreatorRow[]; error?: string };
export async function tokenCreators(ca: string, base = ''): Promise<CreatorsResp> {
  const r = await fetch(\`\${base}/api/token-creators?ca=\${encodeURIComponent(ca)}\`);
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<CreatorsResp>;
}`,

    py: `# Python — creators by CA
import requests
def token_creators(ca: str, base: str = ''):
    r = requests.get(f"{base}/api/token-creators", params={'ca': ca})
    r.raise_for_status()
    return r.json()

print(token_creators('So11111111111111111111111111111111111111112'))`,
  };

  const s_reliability = {
    js: `// JavaScript — AI wallet reliability (Solana)
async function walletReliability(address, pages = 5) {
  const url = \`/api/analyze/wallet-reliability?address=\${encodeURIComponent(address)}&pages=\${pages}\`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { ok:true, score: number, details:{ ... } }
}
walletReliability('Da63jxs5D5G...Jffe9Y', 5).then(console.log);`,

    ts: `// TypeScript — reliability API
type ReliabilityResp = { ok: boolean; score: number; details?: any; error?: string };
export async function walletReliability(address: string, pages = 5, base = ''): Promise<ReliabilityResp> {
  const url = \`\${base}/api/analyze/wallet-reliability?address=\${encodeURIComponent(address)}&pages=\${pages}\`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<ReliabilityResp>;
}`,

    py: `# Python — reliability API
import requests
def wallet_reliability(address: str, pages: int = 5, base: str = ''):
    r = requests.get(f"{base}/api/analyze/wallet-reliability",
                    params={'address': address, 'pages': pages})
    r.raise_for_status()
    return r.json()

print(wallet_reliability('Da63jxs5D5G...Jffe9Y', 5))`,
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <header className="mb-8 animate-slide-in-up">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#0e2018] text-[#74f3bf] border border-[#143626]">
            No authentication required
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            <span className={`${BRAND_GRAD} bg-clip-text text-transparent`}>API Documentation</span>
          </h1>
          <p className="text-[#9feecf]/80 mt-2">
            Integrate Acuvity AI data into your app. Base URL: 
            <span className="font-mono text-[#caffea]">{BASE_HINT || 'https://your-domain.tld'}</span>
          </p>
        </header>

        {/* Sections */}
        <div className="grid gap-6 animate-fade-in">
          <Section
            title="X Handle → Wallet"
            subtitle="Resolve an X (Twitter) developer tag to a mapped Solana wallet."
            params={[
              { name: 'handle', req: true, desc: 'X tag without @' },
            ]}
            snippets={s_x2w}
          />

          <Section
            title="Token Creators"
            subtitle="Find creators and fee shares for a token contract address (CA)."
            params={[
              { name: 'ca', req: true, desc: 'Token mint (CA), base58' },
            ]}
            snippets={s_creators}
          />

          <Section
            title="Wallet Reliability"
            subtitle="AI-powered reliability analysis using on-chain activity."
            params={[
              { name: 'address', req: true, desc: 'Solana wallet address' },
              { name: 'pages', req: false, desc: '1–10 transaction pages to scan (default 5)' },
            ]}
            snippets={s_reliability}
          />
        </div>

        {/* Footer note */}
        <div className="mt-10 text-xs text-[#8fe9c7]/70">
          Respect rate limits, debounce client calls, and cache responses where possible.
          See also&nbsp;
          <Link className="underline hover:text-[#00ff88]" href="/faq">FAQ</Link>.
        </div>
      </div>
    </main>
  );
}