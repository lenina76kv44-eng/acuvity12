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

  const highlightSyntax = (code: string) => {
    return code
      // Keywords
      .replace(/\b(const|let|var|function|async|await|import|export|from|default|if|else|return|try|catch|throw|new|class|extends|interface|type|enum)\b/g, '<span class="syntax-keyword">$1</span>')
      // Strings
      .replace(/(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="syntax-string">$1$2$1</span>')
      // Numbers
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="syntax-number">$1</span>')
      // Functions
      .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, '<span class="syntax-function">$1</span>')
      // Properties
      .replace(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '.<span class="syntax-property">$1</span>')
      // Comments
      .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="syntax-comment">$1</span>')
      // Operators
      .replace(/([=!<>+\-*/%&|^~?:;,])/g, '<span class="syntax-operator">$1</span>');
  };

  return (
    <div className="relative animate-slide-in-up group">
      <button
        onClick={copy}
        className="absolute right-3 top-3 text-xs px-2.5 py-1 rounded-md bg-[#121212] text-[#c7ffe7] hover:bg-[#171717] border border-[#1f1f1f] btn-animated btn-glow opacity-0 group-hover:opacity-100 transition-all duration-300"
      >
        {copied ? (
          <span className="animate-bounce-in text-green-400">✓ Copied</span>
        ) : 'Copy'}
      </button>
      <pre className="overflow-x-auto rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] p-4 text-[12.5px] leading-5 text-[#d7ffe9] hover:border-[#00ff88]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#00ff88]/10">
        <code dangerouslySetInnerHTML={{ __html: highlightSyntax(code) }} />
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
    <section className={`${CARD} animate-slide-in-up card-glow tool-section`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight animate-typewriter">{title}</h2>
          <p className="text-[#9feecf] text-sm mt-1 animate-fade-in stagger-1">{subtitle}</p>
        </div>
        <Tabs value={lang} onChange={setLang} />
      </div>

      <div className="mb-4 overflow-x-auto animate-slide-in-up stagger-2">
        <table className="w-full text-left text-sm border-separate border-spacing-y-1 feature-highlight rounded-lg p-3">
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
                <td className="pr-6 font-mono syntax-variable">{p.name}</td>
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
    <main className="min-h-screen bg-[#0a0a0a] text-white animate-fade-in relative overflow-hidden">
      {/* Enhanced background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] animate-morphing-bg opacity-50"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.05)_0%,transparent_70%)] animate-zoom-pulse"></div>
      
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <header className="mb-8 animate-slide-in-up relative z-10">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#0e2018] text-[#74f3bf] border border-[#143626] animate-glow-border">
            No authentication required
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight animate-gradient-shift">
            <span className={`${BRAND_GRAD} bg-clip-text text-transparent`}>API Documentation</span>
          </h1>
          <p className="text-[#9feecf]/80 mt-2 animate-fade-in stagger-2">
            Integrate Acuvity AI data into your app. Base URL: 
            <span className="font-mono text-[#caffea] syntax-string">{BASE_HINT || 'https://your-domain.tld'}</span>
          </p>
        </header>

        {/* Sections */}
        <div className="grid gap-8 animate-fade-in relative z-10">
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
        <div className="mt-12 text-xs text-[#8fe9c7]/70 animate-slide-in-up stagger-8 relative z-10 p-4 rounded-lg bg-[#0a0a0a]/50 border border-[#1a1a1a] backdrop-blur-sm">
          Respect rate limits, debounce client calls, and cache responses where possible.
          See also&nbsp;
          <Link className="underline hover:text-[#00ff88] transition-all duration-300 syntax-keyword" href="/faq">FAQ</Link>.
        </div>
      </div>
    </main>
  );
}