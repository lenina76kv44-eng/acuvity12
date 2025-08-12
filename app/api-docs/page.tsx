"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { Copy, Check, Code, Terminal, Globe, Key } from "lucide-react";

const codeExamples = {
  javascript: {
    twitterWallet: `// Find wallet by X handle
const response = await fetch('/api/twitter-wallet?handle=username');
const data = await response.json();

if (data.ok) {
  console.log('Wallet:', data.wallet);
} else {
  console.error('Error:', data.error);
}`,
    tokenCreators: `// Find token creators by contract address
const response = await fetch('/api/token-creators?ca=CONTRACT_ADDRESS');
const data = await response.json();

if (data.ok) {
  console.log('Creators:', data.data);
} else {
  console.error('Error:', data.error);
}`,
    walletReliability: `// Analyze wallet reliability
const response = await fetch('/api/analyze/wallet-reliability?address=WALLET_ADDRESS&pages=10');
const data = await response.json();

if (data.ok) {
  console.log('Score:', data.ai.score);
  console.log('Rating:', data.ai.rating);
  console.log('Analysis:', data.ai.summary);
} else {
  console.error('Error:', data.error);
}`
  },
  typescript: {
    twitterWallet: `// Find wallet by X handle
interface TwitterWalletResponse {
  ok: boolean;
  wallet: string | null;
  error?: string;
}

const response = await fetch('/api/twitter-wallet?handle=username');
const data: TwitterWalletResponse = await response.json();

if (data.ok) {
  console.log('Wallet:', data.wallet);
} else {
  console.error('Error:', data.error);
}`,
    tokenCreators: `// Find token creators by contract address
interface Creator {
  username: string | null;
  twitterUsername: string | null;
  wallet: string | null;
  royaltyBps: number;
  isCreator: boolean;
}

interface TokenCreatorsResponse {
  ok: boolean;
  data: Creator[];
  error?: string;
}

const response = await fetch('/api/token-creators?ca=CONTRACT_ADDRESS');
const data: TokenCreatorsResponse = await response.json();

if (data.ok) {
  console.log('Creators:', data.data);
} else {
  console.error('Error:', data.error);
}`,
    walletReliability: `// Analyze wallet reliability
interface ReliabilityResponse {
  ok: boolean;
  metrics: {
    txCount: number;
    solBalance: number | null;
    ageDays: number | null;
    swapCount: number;
    uniqueCounterparties: number;
    bagsFeeClaims: number;
  };
  ai: {
    score: number;
    rating: string;
    bullets: string[];
    summary: string;
  };
  error?: string;
}

const response = await fetch('/api/analyze/wallet-reliability?address=WALLET_ADDRESS&pages=10');
const data: ReliabilityResponse = await response.json();

if (data.ok) {
  console.log('Score:', data.ai.score);
  console.log('Rating:', data.ai.rating);
  console.log('Analysis:', data.ai.summary);
} else {
  console.error('Error:', data.error);
}`
  },
  python: {
    twitterWallet: `# Find wallet by X handle
import requests

response = requests.get('/api/twitter-wallet', params={'handle': 'username'})
data = response.json()

if data['ok']:
    print(f"Wallet: {data['wallet']}")
else:
    print(f"Error: {data['error']}")`,
    tokenCreators: `# Find token creators by contract address
import requests

response = requests.get('/api/token-creators', params={'ca': 'CONTRACT_ADDRESS'})
data = response.json()

if data['ok']:
    print(f"Creators: {data['data']}")
else:
    print(f"Error: {data['error']}")`,
    walletReliability: `# Analyze wallet reliability
import requests

params = {
    'address': 'WALLET_ADDRESS',
    'pages': 10
}

response = requests.get('/api/analyze/wallet-reliability', params=params)
data = response.json()

if data['ok']:
    print(f"Score: {data['ai']['score']}")
    print(f"Rating: {data['ai']['rating']}")
    print(f"Analysis: {data['ai']['summary']}")
else:
    print(f"Error: {data['error']}")`
  }
};

export default function APIDocsPage() {
  const [activeLanguage, setActiveLanguage] = useState<'javascript' | 'typescript' | 'python'>('javascript');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const endpoints = [
    {
      id: 'twitter-wallet',
      title: 'X Handle to Wallet',
      method: 'GET',
      endpoint: '/api/twitter-wallet',
      description: 'Find wallet address associated with an X (Twitter) handle',
      params: [
        { name: 'handle', type: 'string', required: true, description: 'X handle without @ symbol' }
      ]
    },
    {
      id: 'token-creators',
      title: 'Token Creators',
      method: 'GET',
      endpoint: '/api/token-creators',
      description: 'Find creators and fee shares for a token contract address',
      params: [
        { name: 'ca', type: 'string', required: true, description: 'Token contract address' }
      ]
    },
    {
      id: 'wallet-reliability',
      title: 'Wallet Reliability',
      method: 'GET',
      endpoint: '/api/analyze/wallet-reliability',
      description: 'AI-powered wallet reliability analysis',
      params: [
        { name: 'address', type: 'string', required: true, description: 'Solana wallet address' },
        { name: 'pages', type: 'number', required: false, description: 'Number of transaction pages to analyze (1-10, default: 5)' }
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            API <span className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] bg-clip-text text-transparent">Documentation</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl">
            Integrate Acuvity's powerful blockchain analytics into your applications. 
            Access wallet analysis, creator discovery, and AI-powered insights through our REST API.
          </p>
        </header>

        {/* Overview */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#00ff88] rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-black" />
              </div>
              <h2 className="text-2xl font-bold text-[#00ff88]">Getting Started</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Base URL</h3>
                <div className="bg-black/50 border border-gray-700 rounded-lg p-3 font-mono text-sm text-[#00ff88]">
                  https://acuvityai.org
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Authentication</h3>
                <div className="bg-black/50 border border-gray-700 rounded-lg p-3 text-sm text-gray-300">
                  No authentication required
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">Rate Limits</h3>
              <p className="text-gray-300">
                Our API is currently free to use with reasonable rate limits. 
                Please be respectful and avoid excessive requests.
              </p>
            </div>
          </div>
        </section>

        {/* Language Selector */}
        <div className="mb-8">
          <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-700/50 rounded-xl p-1 w-fit">
            {(['javascript', 'typescript', 'python'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLanguage(lang)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeLanguage === lang
                    ? 'bg-[#00ff88] text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* API Endpoints */}
        <div className="space-y-12">
          {endpoints.map((endpoint) => (
            <section key={endpoint.id} className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#00ff88]/10 rounded-xl flex items-center justify-center border border-[#00ff88]/20">
                  <Code className="w-6 h-6 text-[#00ff88]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{endpoint.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="px-2 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono rounded">
                      {endpoint.method}
                    </span>
                    <span className="font-mono text-sm text-gray-400">{endpoint.endpoint}</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-300 mb-6">{endpoint.description}</p>

              {/* Parameters */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Parameters</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 text-[#00ff88]">Name</th>
                        <th className="text-left py-2 text-[#00ff88]">Type</th>
                        <th className="text-left py-2 text-[#00ff88]">Required</th>
                        <th className="text-left py-2 text-[#00ff88]">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endpoint.params.map((param) => (
                        <tr key={param.name} className="border-b border-gray-800">
                          <td className="py-2 font-mono text-white">{param.name}</td>
                          <td className="py-2 text-gray-400">{param.type}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              param.required 
                                ? 'bg-red-500/10 border border-red-500/30 text-red-400' 
                                : 'bg-gray-500/10 border border-gray-500/30 text-gray-400'
                            }`}>
                              {param.required ? 'Required' : 'Optional'}
                            </span>
                          </td>
                          <td className="py-2 text-gray-300">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Code Example */}
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-white">Example</h4>
                  <button
                    onClick={() => copyToClipboard(codeExamples[activeLanguage][endpoint.id as keyof typeof codeExamples.javascript], endpoint.id)}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-300 transition-colors"
                  >
                    {copiedCode === endpoint.id ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                
                {/* Terminal-style code block */}
                <div className="bg-black border border-gray-700 rounded-xl overflow-hidden">
                  {/* Terminal header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-700">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Terminal className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400 font-mono">
                        {activeLanguage}.{activeLanguage === 'python' ? 'py' : 'js'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Code content */}
                  <div className="p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300 font-mono leading-relaxed">
                      <code>{codeExamples[activeLanguage][endpoint.id as keyof typeof codeExamples.javascript]}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Support Section */}
        <section className="mt-16">
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Key className="w-8 h-8 text-[#00ff88]" />
              <h3 className="text-2xl font-bold text-white">Need Help?</h3>
            </div>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Have questions about our API? Need help with integration? 
              Check out our FAQ or get in touch with our team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/faq"
                className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              >
                View FAQ
              </a>
              <a
                href="/contact"
                className="border border-gray-600 hover:border-[#00ff88] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              >
                Contact Support
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}