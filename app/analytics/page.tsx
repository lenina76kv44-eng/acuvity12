"use client";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { BarChart3, TrendingUp, Users, Activity } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-[#888888] text-base">
            Insights and statistics about BAGS ecosystem
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#00ff88]/10">
                <Users className="w-5 h-5 text-[#00ff88]" />
              </div>
              <h3 className="font-semibold text-sm">Total Creators</h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">Coming Soon</div>
            <div className="text-xs text-[#888888]">Active creators</div>
          </div>

          <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#00ff88]/10">
                <Activity className="w-5 h-5 text-[#00ff88]" />
              </div>
              <h3 className="font-semibold text-sm">Total Tokens</h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">Coming Soon</div>
            <div className="text-xs text-[#888888]">BAGS tokens</div>
          </div>

          <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#00ff88]/10">
                <TrendingUp className="w-5 h-5 text-[#00ff88]" />
              </div>
              <h3 className="font-semibold text-sm">Volume</h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">Coming Soon</div>
            <div className="text-xs text-[#888888]">24h volume</div>
          </div>

          <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#00ff88]/10">
                <BarChart3 className="w-5 h-5 text-[#00ff88]" />
              </div>
              <h3 className="font-semibold text-sm">Growth</h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">Coming Soon</div>
            <div className="text-xs text-[#888888]">Weekly growth</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-6">
            <h3 className="text-lg font-semibold mb-4">Token Creation Trends</h3>
            <div className="h-64 flex items-center justify-center text-[#666666]">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chart visualization coming soon</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-6">
            <h3 className="text-lg font-semibold mb-4">Top Creators</h3>
            <div className="h-64 flex items-center justify-center text-[#666666]">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Creator leaderboard coming soon</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-[#1a1a1a] bg-[#111111] p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-4 rounded-full bg-[#00ff88]/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-[#00ff88]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Advanced Analytics Coming Soon</h3>
            <p className="text-[#888888] mb-6">
              We're building comprehensive analytics to provide deep insights into the BAGS ecosystem.
            </p>
            <div className="text-sm text-[#666666]">
              Planned features:
              <ul className="mt-2 space-y-1">
                <li>• Real-time ecosystem metrics</li>
                <li>• Creator performance analytics</li>
                <li>• Token launch success rates</li>
                <li>• Market trend analysis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}