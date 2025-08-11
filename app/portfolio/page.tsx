"use client";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { Coins, TrendingUp, Wallet } from "lucide-react";

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio Tracker</h1>
          <p className="text-[#888888] text-base">
            Track your BAGS tokens and portfolio performance
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#00ff88]/10">
                <Wallet className="w-5 h-5 text-[#00ff88]" />
              </div>
              <h3 className="font-semibold">Total Value</h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">Coming Soon</div>
            <div className="text-sm text-[#888888]">Portfolio tracking</div>
          </div>

          <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#00ff88]/10">
                <Coins className="w-5 h-5 text-[#00ff88]" />
              </div>
              <h3 className="font-semibold">BAGS Tokens</h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">Coming Soon</div>
            <div className="text-sm text-[#888888]">Token count</div>
          </div>

          <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#00ff88]/10">
                <TrendingUp className="w-5 h-5 text-[#00ff88]" />
              </div>
              <h3 className="font-semibold">Performance</h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">Coming Soon</div>
            <div className="text-sm text-[#888888]">24h change</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-4 rounded-full bg-[#00ff88]/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Coins className="w-8 h-8 text-[#00ff88]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Portfolio Tracking Coming Soon</h3>
            <p className="text-[#888888] mb-6">
              We're working on advanced portfolio tracking features to help you monitor your BAGS tokens and overall performance.
            </p>
            <div className="text-sm text-[#666666]">
              Features in development:
              <ul className="mt-2 space-y-1">
                <li>• Real-time token values</li>
                <li>• Performance analytics</li>
                <li>• Historical tracking</li>
                <li>• Export capabilities</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}