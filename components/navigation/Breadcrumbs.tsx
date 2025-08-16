"use client";
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const pathNames: Record<string, string> = {
  '/': 'Home',
  '/twitter-search': 'X Search',
  '/token-creators': 'CA Finder',
  '/wallet-to-x': 'Wallet → X',
  '/wallet-check': 'Wallet Check',
  '/whale-notifications': 'Whale Notifications',
  '/faq': 'FAQ',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  if (pathname === '/') return null;

  const pathSegments = pathname.split('/').filter(Boolean);
  
  return (
    <nav className="flex items-center space-x-2 text-sm text-[#888888] mb-6">
      <Link 
        href="/" 
        className="flex items-center hover:text-[#00ff88] transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/');
        const isLast = index === pathSegments.length - 1;
        
        return (
          <div key={path} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-[#444444]" />
            {isLast ? (
              <span className="text-white font-medium">
                {pathNames[path] || segment}
              </span>
            ) : (
              <Link 
                href={path}
                className="hover:text-[#00ff88] transition-colors"
              >
                {pathNames[path] || segment}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}