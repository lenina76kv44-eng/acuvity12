"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Users, BarChart3, Coins, ArrowRight, CheckCircle, Zap, Shield, Target } from "lucide-react";
import Icon from '@/src/components/ui/Icon';
import BagsLivePanel from '@/src/components/home/BagsLivePanel';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Hero Section */}
      <div className="pt-0">
        <div id="home" className="relative min-h-screen overflow-hidden flex items-center hero-bg">
          <div className="relative z-40 flex flex-col lg:flex-row items-center justify-between w-full px-4 py-20 container mx-auto hero-content animate-fade-in">
            {/* Left Content */}
            <div className="flex-1 max-w-2xl lg:mr-8 text-center lg:text-left animate-slide-in-left">
              <h1 className="text-5xl md:text-7xl font-black leading-tight mb-8 tracking-tight font-display text-white">
                SHAPING THE<br />
                FUTURE OF<br />
                <span style={{ color: '#0E983B' }}>WEB3 ANALYTICS</span>
              </h1>
              <p className="text-xl md:text-2xl max-w-2xl text-gray-400 leading-relaxed mb-12 font-normal">
                Advanced Solana wallet scanner — detect links, track memecoin activity, avoid rugs.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <Link
                  href="/twitter-search"
                  className="btn-primary btn-animated px-10 py-4 text-lg font-bold inline-flex items-center gap-2"
                >
                  <Icon name="analyze" size={20} />
                  GET STARTED
                </Link>
                <Link
                  href="/faq"
                  className="btn-secondary btn-animated px-10 py-4 text-lg font-bold"
                >
                  DOCUMENTATION
                </Link>
              </div>
            </div>

            {/* Right Scanner Card */}
            <div className="flex-shrink-0 w-full lg:w-96 mt-12 lg:mt-0 animate-slide-in-right">
              <section 
                aria-label="Acuvity Scanner banner"
                className="scanner-card relative overflow-hidden hover-glow"
                style={{
                  background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(20, 20, 20, 0.9) 100%)',
                  borderRadius: '24px',
                  padding: '28px',
                  boxShadow: 'rgba(14, 152, 59, 0.3) 0px 8px 30px',
                  border: '1px solid rgba(14, 152, 59, 0.2)'
                }}
              >
                {/* Animated SVG Background */}
                <svg 
                  viewBox="0 0 1200 420" 
                  width="100%" 
                  height="auto" 
                  className="absolute inset-0 pointer-events-none"
                >
                  <defs>
                    <radialGradient id="rg" cx="50%" cy="40%" r="60%">
                      <stop offset="0%" stopColor="#0E983B" stopOpacity="0.55" />
                      <stop offset="60%" stopColor="#22C55E" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                    <filter id="blur10" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="10" />
                    </filter>
                    <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="6" stdDeviation="10" floodOpacity="0.2" />
                    </filter>
                  </defs>
                  <circle 
                    cx="320" 
                    cy="140" 
                    r="380" 
                    fill="url(#rg)" 
                    opacity="0.6"
                    className="animate-pulse"
                  />
                  <g filter="url(#softShadow)" className="animate-float">
                    <rect x="70" y="250" width="84" height="84" rx="18" fill="#0E983B" opacity="0.16" />
                    <rect x="165" y="280" width="56" height="56" rx="14" fill="#0E983B" opacity="0.20" />
                  </g>
                  <g filter="url(#softShadow)" className="animate-float-delayed">
                    <rect x="1010" y="84" width="70" height="70" rx="16" fill="#0E983B" opacity="0.18" />
                    <rect x="1100" y="130" width="44" height="44" rx="12" fill="#0E983B" opacity="0.22" />
                  </g>
                  <rect 
                    x="24" 
                    y="24" 
                    width="700" 
                    height="110" 
                    rx="22" 
                    fill="#000000" 
                    opacity="0.25" 
                    filter="url(#blur10)" 
                  />
                </svg>

                <div className="relative z-10 flex flex-col gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src="https://i.imgur.com/CO5qw6E.png" 
                        width="40" 
                        height="40" 
                        alt="Acuvity logo" 
                        className="rounded-full object-cover floating-element"
                        style={{ filter: 'drop-shadow(rgba(0, 0, 0, 0.12) 0px 4px 10px)' }}
                      />
                      <h2 className="text-2xl font-black text-white tracking-wide">
                        ACUVITY SCANNER
                      </h2>
                    </div>
                    <p className="text-gray-300 text-base leading-relaxed mb-6 max-w-lg">
                      Fast, comprehensive wallet analysis with AI-powered security insights. Detect links, track memecoin activity, avoid rugs with AI assistance.
                    </p>
                    <Link
                      href="/twitter-search"
                      className="inline-flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-white btn-animated"
                      style={{
                        background: 'linear-gradient(135deg, #0E983B, #22C55E)',
                        boxShadow: 'rgba(14, 152, 59, 0.35) 0px 10px 24px'
                      }}
                    >
                      Start scanning
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3">
                      <Icon name="history" size={18} className="mr-1" />
                      <span className="text-white font-semibold text-sm">Deep Transaction analysis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Icon name="shield" size={18} className="mr-1" />
                      <span className="text-white font-semibold text-sm">Risk pattern detection</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Icon name="trend" size={18} className="mr-1" />
                      <span className="text-white font-semibold text-sm">AI-powered insights</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Bags Live Markets */}
      <BagsLivePanel />

      {/* What is Acuvity Section */}
      <section id="features" className="py-24 text-center relative z-40">
        <div className="container mx-auto px-4">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white font-display uppercase tracking-tight">
              WHAT IS ACUVITY
            </h2>
            <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed font-normal">
              Build your Web3 analytics workflows in minutes. Analyze any blockchain address 
              with real-time risk scores. Deploy custom AI agents directly from your dashboard.
            </p>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Discover */}
            <div className="group relative feature-card card-hover cursor-pointer bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-[#0E983B]/50 transition-all duration-300 animate-slide-in-up stagger-1">
              <div className="relative z-10">
                <div className="mb-6 flex justify-center">
                  <Icon name="bubbleGraph" size={64} className="icon3d floating-element" />
                </div>
                <h3 className="text-3xl font-black mb-6 font-display uppercase tracking-tight flex items-center justify-center" style={{ color: '#0E983B' }}>
                  DISCOVER.
                </h3>
                <ul className="text-left space-y-2 text-gray-300 mb-8">
                  <li>• Uncover hidden connections</li>
                  <li>• Analyze wallet behavior</li>
                  <li>• Detect Solana token launches</li>
                  <li>• Track memecoin activity</li>
                  <li>• Identify shared investments</li>
                  <li>• Cross-reference transactions</li>
                  <li>• Pattern recognition</li>
                </ul>
                <Link
                  href="/twitter-search"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wide btn-animated text-black"
                  style={{ background: '#0E983B' }}
                >
                  SCAN NOW
                </Link>
              </div>
            </div>

            {/* Analyze */}
            <div className="group relative feature-card card-hover cursor-pointer bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-[#0E983B]/50 transition-all duration-300 animate-slide-in-up stagger-2">
              <div className="relative z-10">
                <div className="mb-6 flex justify-center">
                  <Icon name="riskGauge" size={64} className="icon3d floating-element" />
                </div>
                <h3 className="text-3xl font-black mb-6 font-display uppercase tracking-tight flex items-center justify-center" style={{ color: '#0E983B' }}>
                  ANALYZE.
                </h3>
                <ul className="text-left space-y-2 text-gray-300 mb-8">
                  <li>• Risk assessment and scoring</li>
                  <li>• Behavioral analysis with AI</li>
                  <li>• Advanced wallet metrics</li>
                  <li>• Transaction pattern analysis</li>
                  <li>• Creator identification</li>
                  <li>• Fee structure analysis</li>
                  <li>• Reliability scoring</li>
                </ul>
                <Link
                  href="/wallet-check"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wide btn-animated text-black"
                  style={{ background: '#0E983B' }}
                >
                  CHECK NOW
                </Link>
              </div>
            </div>

            {/* Deploy */}
            <div className="group relative feature-card bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 opacity-50 cursor-not-allowed animate-slide-in-up stagger-3">
              <div className="relative z-10">
                <div className="mb-6 flex justify-center">
                  <Icon name="automation" size={64} className="icon3d floating-element" />
                </div>
                <h3 className="text-3xl font-black mb-6 font-display uppercase tracking-tight flex items-center justify-center" style={{ color: '#0E983B' }}>
                  DEPLOY.
                </h3>
                <ul className="text-left space-y-2 text-gray-300 mb-8">
                  <li>• Advanced blockchain intelligence</li>
                  <li>• Automated risk monitoring</li>
                  <li>• Custom alert systems</li>
                  <li>• Real-time notifications</li>
                  <li>• API integration ready</li>
                  <li>• Scalable infrastructure</li>
                  <li>• Enterprise reporting</li>
                </ul>
                <div className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wide bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-gray-200">
                  COMING SOON
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Analysis Tools Section */}
      <section id="tools" className="py-24 relative z-10" style={{
        background: 'linear-gradient(135deg, rgba(14, 152, 59, 0.05) 0%, rgba(34, 197, 94, 0.02) 50%, rgba(14, 152, 59, 0.05) 100%)'
      }}>
        <div className="container mx-auto px-4 relative z-40">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white font-display uppercase tracking-tight">
              LIVE ANALYSIS TOOLS
            </h2>
            <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed font-normal">
              Experience the power of professional blockchain analysis. Test our tools instantly - 
              no registration required. Sign up only for advanced analysis history and access 
              advanced features.
            </p>
          </div>

          <div className="space-y-12">
            {/* X Search Tool */}
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 card-hover animate-slide-in-up stagger-1">
              <div className="flex items-center gap-4 mb-6">
                <Icon name="xSearch" size={48} className="icon3d" />
                <h3 className="text-2xl font-black font-display uppercase tracking-tight flex items-center" style={{ color: '#0E983B' }}>
                  X SEARCH SCANNER
                </h3>
              </div>
              <p className="text-gray-400 mb-6">
                Analyze habits and trace history through Solana transactions
              </p>
              <Link
                href="/twitter-search"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold btn-animated text-black"
                style={{ background: '#0E983B' }}
              >
                <Icon name="analyze" size={18} className="mr-2" />
                START SCANNING
              </Link>
            </div>

            {/* CA Finder Tool */}
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 card-hover animate-slide-in-up stagger-2">
              <div className="flex items-center gap-4 mb-6">
                <Icon name="caFinder" size={48} className="icon3d" />
                <h3 className="text-2xl font-black font-display uppercase tracking-tight flex items-center" style={{ color: '#0E983B' }}>
                  CA FINDER
                </h3>
              </div>
              <p className="text-gray-400 mb-6">
                Discover token creators and fee structures through contract analysis
              </p>
              <Link
                href="/token-creators"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold btn-animated text-black"
                style={{ background: '#0E983B' }}
              >
                <Icon name="find" size={18} className="mr-2" />
                EXPLORE CREATORS
              </Link>
            </div>

            {/* Wallet Reliability Check */}
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 card-hover animate-slide-in-up stagger-3">
              <div className="flex items-center gap-4 mb-6">
                <Icon name="walletCheck" size={48} className="icon3d" />
                <h3 className="text-2xl font-black font-display uppercase tracking-tight flex items-center" style={{ color: '#0E983B' }}>
                  WALLET RELIABILITY CHECK
                </h3>
              </div>
              <p className="text-gray-400 mb-6">
                AI-powered wallet analysis with behavioral risk assessment
              </p>
              <Link
                href="/wallet-check"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold btn-animated text-black"
                style={{ background: '#0E983B' }}
              >
                <Icon name="check" size={18} className="mr-2" />
                CHECK WALLET
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-24 relative z-30 overflow-hidden">
        <div className="container mx-auto px-4 relative z-40">
          <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/20 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-12 max-w-6xl mx-auto card-hover animate-scale-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="animate-slide-in-left">
                <h2 className="text-4xl md:text-5xl font-black mb-6 text-white font-display uppercase tracking-tight">
                  OUR ECOSYSTEM
                </h2>
                <p className="text-gray-400 text-xl mb-8 leading-relaxed font-normal">
                  Everything on Web3, powered by our AI. Acuvity is one of the first 
                  platforms that unifies analytics, risk, deployment and on-chain 
                  governance in one place.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/twitter-search"
                    className="inline-flex items-center gap-2 px-10 py-4 text-lg font-bold rounded-xl text-black btn-animated"
                    style={{ background: '#0E983B' }}
                  >
                    <Icon name="analyze" size={20} className="mr-2" />
                    EXPLORE
                  </Link>
                  <Link
                    href="/faq"
                    className="px-10 py-4 text-lg font-bold rounded-xl border border-gray-600 hover:border-[#0E983B] text-white btn-animated"
                  >
                    DOCUMENTATION
                  </Link>
                </div>
              </div>

              <div className="text-center animate-slide-in-right">
                <div className="relative">
                  <img 
                    src="https://i.imgur.com/jcLZvxY.png" 
                    alt="Analytics" 
                    className="w-64 h-64 mx-auto floating-element"
                    style={{ filter: 'drop-shadow(rgba(14, 152, 59, 0.3) 0px 20px 40px)' }}
                  />
                  
                  {/* Floating Icons */}
                  <div className="absolute top-4 right-4 animate-float">
                    <Icon name="shield" size={48} />
                  </div>
                  <div className="absolute top-12 left-12 animate-float-delayed">
                    <Icon name="history" size={40} />
                  </div>
                  <div className="absolute bottom-16 right-12 animate-float">
                    <Icon name="swap" size={44} />
                  </div>
                  <div className="absolute top-32 left-4 animate-float-delayed">
                    <Icon name="automation" size={36} />
                  </div>
                  <div className="absolute bottom-4 left-16 animate-float">
                    <Icon name="alert" size={32} />
                  </div>
                  <div className="absolute top-8 right-32 animate-float-delayed">
                    <Icon name="bridge" size={36} />
                  </div>
                </div>
                
                {/* Ecosystem badges */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  <Icon name="helius" size={22} className="mx-1" alt="Helius" />
                  <Icon name="jupiter" size={22} className="mx-1" alt="Jupiter" />
                  <Icon name="dexscreener" size={22} className="mx-1" alt="Dexscreener" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}