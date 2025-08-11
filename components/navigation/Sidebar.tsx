"use client";
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Users, Coins, BarChart3, Settings, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const mainNavigation = [
  { name: 'X Search', href: '/twitter-search', icon: Search, description: 'Find wallets by X handle' },
  { name: 'CA Finder', href: '/token-creators', icon: Users, description: 'Find token creators' },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside className={`bg-[#111111] border-r border-[#1a1a1a] transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } ${className}`}>
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="flex justify-end p-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {mainNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20'
                    : 'text-[#888888] hover:text-white hover:bg-[#1a1a1a]'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-[#666666] group-hover:text-[#888888] transition-colors">
                      {item.description}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="px-4 py-4 border-t border-[#1a1a1a] space-y-2">
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#00ff88]/10 text-[#00ff88]'
                    : 'text-[#888888] hover:text-white hover:bg-[#1a1a1a]'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}