"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

function parseJsonSafe(raw: string) {
  try { return { ok: true, data: JSON.parse(raw) }; }
  catch { return { ok: false, error: raw || "Empty response" }; }
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="particles-container">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="particle animate-particle-float" style={{animationDelay: `${i * 0.5}s`}}></div>
            ))}
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center animate-slide-in-up">
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#00ff88]/20 to-[#00cc6a]/20 border border-[#00ff88]/30 text-[#00ff88] text-sm font-semibold animate-glow-pulse">
                🚀 Advanced Solana Analytics
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 find-title-shine animate-text-glow">
              Acuvity AI
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed animate-slide-in-up stagger-1">
              Advanced Solana wallet scanner — detect links, track memecoin activity, avoid rugs. 
              <span className="text-[#00ff88] font-semibold">AI-powered blockchain analytics.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-in-up stagger-2">
              <a
                href="/twitter-search"
                className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-[#00ff88]/25 btn-enhanced magnetic-hover"
              >
                Start Analyzing
              </a>
              <a
                href="/api-docs"
                className="border-2 border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-110 btn-enhanced"
              >
                View API
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 animate-slide-in-up stagger-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center animate-scale-in stagger-1">
              <div className="text-3xl md:text-4xl font-bold text-[#00ff88] mb-2 animate-text-glow">1M+</div>
              <div className="text-gray-400">Wallets Analyzed</div>
            </div>
            <div className="text-center animate-scale-in stagger-2">
              <div className="text-3xl md:text-4xl font-bold text-[#00ff88] mb-2 animate-text-glow">50K+</div>
              <div className="text-gray-400">Tokens Tracked</div>
            </div>
            <div className="text-center animate-scale-in stagger-3">
              <div className="text-3xl md:text-4xl font-bold text-[#00ff88] mb-2 animate-text-glow">99.9%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
            <div className="text-center animate-scale-in stagger-4">
              <div className="text-3xl md:text-4xl font-bold text-[#00ff88] mb-2 animate-text-glow">24/7</div>
              <div className="text-gray-400">Real-time Data</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20 animate-slide-in-up stagger-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 find-green-gradient">
              Powerful Analytics Tools
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Comprehensive blockchain intelligence at your fingertips
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 card-hover enhanced-glow animate-scale-in stagger-1 magnetic-hover">
              <div className="w-16 h-16 bg-[#00ff88]/10 rounded-2xl flex items-center justify-center mb-6 animate-glow-pulse">
                <svg className="w-8 h-8 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4 animate-text-glow">X Search</h3>
              <p className="text-gray-400 mb-6">Find wallet addresses from X (Twitter) handles and discover BAGS tokens.</p>
              <a href="/twitter-search" className="text-[#00ff88] hover:text-[#00cc6a] font-semibold transition-colors">
                Try X Search →
              </a>
            </div>

            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 card-hover enhanced-glow animate-scale-in stagger-2 magnetic-hover">
              <div className="w-16 h-16 bg-[#00ff88]/10 rounded-2xl flex items-center justify-center mb-6 animate-glow-pulse">
                <svg className="w-8 h-8 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4 animate-text-glow">CA Finder</h3>
              <p className="text-gray-400 mb-6">Discover token creators and fee structures by contract address.</p>
              <a href="/token-creators" className="text-[#00ff88] hover:text-[#00cc6a] font-semibold transition-colors">
                Try CA Finder →
              </a>
            </div>

            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 card-hover enhanced-glow animate-scale-in stagger-3 magnetic-hover">
              <div className="w-16 h-16 bg-[#00ff88]/10 rounded-2xl flex items-center justify-center mb-6 animate-glow-pulse">
                <svg className="w-8 h-8 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4 animate-text-glow">Wallet Check</h3>
              <p className="text-gray-400 mb-6">AI-powered reliability analysis and risk assessment.</p>
              <a href="/wallet-check" className="text-[#00ff88] hover:text-[#00cc6a] font-semibold transition-colors">
                Try Wallet Check →
              </a>
            </div>

            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 card-hover enhanced-glow animate-scale-in stagger-4 magnetic-hover">
              <div className="w-16 h-16 bg-[#00ff88]/10 rounded-2xl flex items-center justify-center mb-6 animate-glow-pulse">
                <svg className="w-8 h-8 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4 animate-text-glow">Whale Alerts</h3>
              <p className="text-gray-400 mb-6">Real-time notifications from whale activity monitoring.</p>
              <a href="/whale-notifications" className="text-[#00ff88] hover:text-[#00cc6a] font-semibold transition-colors">
                View Alerts →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 animate-slide-in-up stagger-5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-12 enhanced-glow magnetic-hover">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 find-green-gradient animate-text-glow">
              Ready to Start Analyzing?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust Acuvity AI for their Solana blockchain analytics needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/twitter-search"
                className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-[#00ff88]/25 btn-enhanced magnetic-hover"
              >
                Start Free Analysis
              </a>
              <a
                href="/api-docs"
                className="border-2 border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-110 btn-enhanced"
              >
                Explore API
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}