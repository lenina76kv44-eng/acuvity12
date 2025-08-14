'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

// Syntax highlighting function
function highlightSyntax(code: string, lang: Lang): string {
  if (lang === 'js' || lang === 'ts') {
    return code
      .replace(/(async|await|function|const|let|var|if|else|for|while|return|import|export|from|as|type|interface|Promise|string|number|boolean|null|undefined)\b/g, '<span class="keyword">$1</span>')
      .replace(/(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="string">$1$2$1</span>')
      .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
      .replace(/\b(\w+)(?=\s*\()/g, '<span class="function">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>')
      .replace(/(\w+)(?=\s*:)/g, '<span class="property">$1</span>');
  } else if (lang === 'py') {
    return code
      .replace(/(def|class|if|else|elif|for|while|return|import|from|as|try|except|with|async|await|lambda|yield)\b/g, '<span class="keyword">$1</span>')
      .replace(/(print|len|str|int|float|list|dict|tuple|set|range|enumerate|zip)\b/g, '<span class="builtin">$1</span>')
      .replace(/(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="string">$1$2$1</span>')
      .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
      .replace(/\b(\w+)(?=\s*\()/g, '<span class="function">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
  }
  return code;
}

const BRAND_GRAD = 'bg-gradient-to-r from-[#00ff88] to-[#00cc6a]';
const BORDER = 'border border-[#1a1a1a]';
const CARD = `rounded-2xl ${BORDER} bg-[#0d0d0d] p-6 shadow-[0_0_0_1px_rgba(0,255,136,0.04)] hover:shadow-[0_10px_30px_rgba(0,255,136,0.08)] transition-all enhanced-glow`;

type Lang = 'js' | 'ts' | 'py';

function Tabs({
  value, onChange,
}: { value: Lang; onChange: (v: Lang) => void }) {
  const btn = 'px-3 py-1.5 rounded-md text-xs font-semibold';
  const active = 'bg-[#00ff88] text-black animate-glow-pulse';
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
function CodeBlock({ code, lang }: { code: string; lang: Lang }) {
  const [copied, setCopied] = useState(false);
  const highlightedCode = useMemo(() => highlightSyntax(code, lang), [code, lang]);
  
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="relative animate-slide-in-up code-block">
      <button
        onClick={copy}
        className="copy-button"
      >
        {copied ? (
          <span className="animate-bounce-in">✓ Copied</span>
        ) : 'Copy'}
      </button>
      <pre className={`overflow-x-auto rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] p-4 text-[13px] leading-6 text-[#d7ffe9] syntax-${lang}`}>
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
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
    <section className={`${CARD} scroll-animate`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight animate-text-glow">{title}</h2>
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

      <CodeBlock code={code} lang={lang} />
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
        <header className="mb-12 scroll-animate">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#0e2018] text-[#74f3bf] border border-[#143626] animate-glow-pulse">
            No authentication required
          </div>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight animate-text-glow">
            <span className={`${BRAND_GRAD} bg-clip-text text-transparent`}>API Documentation</span>
          </h1>
          <p className="text-[#9feecf]/80 mt-2">
            Integrate Acuvity AI data into your app. Base URL: 
            <span className="font-mono text-[#caffea]">{BASE_HINT || 'https://your-domain.tld'}</span>
          </p>
          
          {/* API Overview */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 enhanced-glow scroll-animate-left">
              <div className="w-10 h-10 bg-[#00ff88]/10 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#00ff88] mb-2">Fast & Reliable</h3>
              <p className="text-gray-300 text-sm">Real-time data with sub-second response times and 99.9% uptime.</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 enhanced-glow scroll-animate">
              <div className="w-10 h-10 bg-[#00ff88]/10 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#00ff88] mb-2">No Auth Required</h3>
              <p className="text-gray-300 text-sm">Start using immediately without API keys or registration.</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 enhanced-glow scroll-animate-right">
              <div className="w-10 h-10 bg-[#00ff88]/10 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#00ff88] mb-2">AI-Powered</h3>
              <p className="text-gray-300 text-sm">Advanced AI analysis for wallet reliability and risk assessment.</p>
            </div>
          </div>
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
        <div className="mt-12 text-center scroll-animate">
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 enhanced-glow">
            <h3 className="text-lg font-semibold text-[#00ff88] mb-2">Need Help?</h3>
            <p className="text-gray-300 text-sm mb-4">
              Respect rate limits, debounce client calls, and cache responses where possible.
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                href="/faq" 
                className="px-4 py-2 bg-[#00ff88] text-black rounded-lg font-semibold hover:bg-[#00cc6a] transition-all btn-animated"
              >
                View FAQ
              </Link>
              <Link 
                href="/contact" 
                className="px-4 py-2 border border-gray-600 text-white rounded-lg font-semibold hover:border-[#00ff88] transition-all btn-animated"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
          Respect rate limits, debounce client calls, and cache responses where possible.
          See also&nbsp;
          <Link className="underline hover:text-[#00ff88]" href="/faq">FAQ</Link>.
        </div>
      </div>
    </main>
  );
}