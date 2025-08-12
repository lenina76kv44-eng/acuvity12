"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Users, BarChart3, Coins, ArrowRight, CheckCircle, Zap, Shield, Target } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f1419] to-[#0a0a0a]" />
        <AnimatedBackground />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
                SHAPING THE<br />
                FUTURE OF<br />
                <span className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] bg-clip-text text-transparent">
                  WEB3 ANALYTICS
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Advanced Solana wallet scanner — detect links, track<br />
                memecoin activity, avoid rugs.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/twitter-search"
                className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#00ff88]/25"
              >
                GET STARTED
              </Link>
              <Link
                href="/faq"
                className="border border-gray-600 hover:border-[#00ff88] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105"
              >
                DOCUMENTATION
              </Link>
            </div>

            {/* Feature Preview Card */}
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#00ff88] rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-black" />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-[#00ff88]">ACUVITY SCANNER</h3>
                  <p className="text-gray-400">Fast, comprehensive wallet analysis with AI-powered security insights. Detect links, track memecoin activity, avoid rugs with AI assistance.</p>
                </div>
              </div>
              
              <Link
                href="/twitter-search"
                className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-2"
              >
                Start Scanning
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#00ff88]" />
                  <span className="text-gray-300">Deep Transaction analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#00ff88]" />
                  <span className="text-gray-300">Risk pattern detection</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#00ff88]" />
                  <span className="text-gray-300">AI-powered insights</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#00ff88]" />
                  <span className="text-gray-300">Real-time monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What is Acuvity Section */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-8">WHAT IS ACUVITY</h2>
            <p className="text-xl text-gray-400 max-w-4xl mx-auto mb-16 leading-relaxed">
              Build your Web3 analytics workflows in minutes. Analyze any blockchain address 
              with real-time risk scores. Deploy custom AI agents directly from your dashboard.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Discover */}
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-[#00ff88]/50 transition-all duration-300">
                <div className="w-16 h-16 bg-[#00ff88] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-[#00ff88] mb-4">DISCOVER.</h3>
                <ul className="text-left space-y-2 text-gray-300">
                  <li>• Uncover hidden connections</li>
                  <li>• Analyze wallet behavior</li>
                  <li>• Detect Solana token launches</li>
                  <li>• Track memecoin activity</li>
                  <li>• Identify shared investments</li>
                  <li>• Cross-reference transactions</li>
                  <li>• Pattern recognition</li>
                </ul>
              </div>

              {/* Analyze */}
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-[#00ff88]/50 transition-all duration-300">
                <div className="w-16 h-16 bg-[#00ff88] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-[#00ff88] mb-4">ANALYZE.</h3>
                <ul className="text-left space-y-2 text-gray-300">
                  <li>• Risk assessment and scoring</li>
                  <li>• Behavioral analysis with AI</li>
                  <li>• Advanced wallet metrics</li>
                  <li>• Transaction pattern analysis</li>
                  <li>• Creator identification</li>
                  <li>• Fee structure analysis</li>
                  <li>• Reliability scoring</li>
                </ul>
              </div>

              {/* Deploy */}
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-[#00ff88]/50 transition-all duration-300">
                <div className="w-16 h-16 bg-[#00ff88] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-[#00ff88] mb-4">DEPLOY.</h3>
                <ul className="text-left space-y-2 text-gray-300">
                  <li>• Advanced blockchain intelligence</li>
                  <li>• Automated risk monitoring</li>
                  <li>• Custom alert systems</li>
                  <li>• Real-time notifications</li>
                  <li>• API integration ready</li>
                  <li>• Scalable infrastructure</li>
                  <li>• Enterprise reporting</li>
                </ul>
              </div>
            </div>

            <div className="mt-12">
              <Link
                href="/twitter-search"
                className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#00ff88]/25 inline-flex items-center gap-2"
              >
                EXPLORE
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Live Analysis Tools Section */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold mb-8">LIVE ANALYSIS TOOLS</h2>
              <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                Experience the power of professional blockchain analysis. Test our tools instantly - 
                no registration required. Sign up only for advanced analysis history and access 
                advanced features.
              </p>
            </div>

            <div className="space-y-12">
              {/* X Search Tool */}
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#00ff88] rounded-xl flex items-center justify-center">
                    <Search className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#00ff88]">X SEARCH SCANNER</h3>
                </div>
                <p className="text-gray-400 mb-6">
                  Analyze habits and trace history through Solana transactions
                </p>
                <Link
                  href="/twitter-search"
                  className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-2"
                >
                  START SCANNING
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* CA Finder Tool */}
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#00ff88] rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#00ff88]">CA FINDER</h3>
                </div>
                <p className="text-gray-400 mb-6">
                  Discover token creators and fee structures through contract analysis
                </p>
                <Link
                  href="/token-creators"
                  className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-2"
                >
                  EXPLORE CREATORS
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Wallet Reliability Check */}
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#00ff88] rounded-xl flex items-center justify-center">
                    <Coins className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#00ff88]">WALLET RELIABILITY CHECK</h3>
                </div>
                <p className="text-gray-400 mb-6">
                  AI-powered wallet analysis with behavioral risk assessment
                </p>
                <Link
                  href="/wallet-check"
                  className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-2"
                >
                  CHECK WALLET
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Wallet to X Tool */}
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#00ff88] rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#00ff88]">WALLET → X TAGS</h3>
                </div>
                <p className="text-gray-400 mb-6">
                  Reverse lookup to find X (Twitter) handles associated with wallet addresses
                </p>
                <Link
                  href="/wallet-to-x"
                  className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-2"
                >
                  FIND X TAGS
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Ecosystem Section */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-8">OUR ECOSYSTEM</h2>
            <p className="text-xl text-gray-400 max-w-4xl mx-auto mb-16 leading-relaxed">
              Everything on Web3, powered by our AI. Acuvity is one of the first 
              platforms that unifies analytics, risk, deployment and on-chain 
              governance in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/twitter-search"
                className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#00ff88]/25"
              >
                EXPLORE
              </Link>
              <Link
                href="/faq"
                className="border border-gray-600 hover:border-[#00ff88] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105"
              >
                DOCUMENTATION
              </Link>
            </div>

            {/* Ecosystem Visual */}
            <div className="relative">
              <div className="w-64 h-64 mx-auto bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-3xl flex items-center justify-center mb-8 hover:scale-105 transition-all duration-300">
                <Target className="w-32 h-32 text-black" />
              </div>
              
              {/* Floating Icons */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center animate-float">
                  <Search className="w-6 h-6 text-[#00ff88]" />
                </div>
                <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center animate-float-delayed">
                  <Users className="w-6 h-6 text-[#00ff88]" />
                </div>
                <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center animate-float">
                  <BarChart3 className="w-6 h-6 text-[#00ff88]" />
                </div>
                <div className="absolute bottom-1/3 right-1/3 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center animate-float-delayed">
                  <Coins className="w-6 h-6 text-[#00ff88]" />
                </div>
                <div className="absolute top-1/2 left-1/6 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center animate-float">
                  <Shield className="w-6 h-6 text-[#00ff88]" />
                </div>
                <div className="absolute top-1/2 right-1/6 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center animate-float-delayed">
                  <Zap className="w-6 h-6 text-[#00ff88]" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AnimatedBackground() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    const particleCount = 50;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.1,
    }));
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + particle.speedX + window.innerWidth) % window.innerWidth,
        y: (particle.y + particle.speedY + window.innerHeight) % window.innerHeight,
      })));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-[#00ff88]"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
          }}
        />
      ))}
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 136, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>
    </div>
  );
}