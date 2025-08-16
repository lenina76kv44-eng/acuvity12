"use client";
import Link from 'next/link';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-3 hover:opacity-80 transition-all duration-300 group hover:scale-105"
          >
            <img 
              src="https://i.imgur.com/jcLZvxY.png" 
              alt="Acuvity" 
              className="w-12 h-12 rounded-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ease-out"
            />
            <span className="text-xl font-bold text-white">Acuvity</span>
          </button>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://x.com/AcuvityAI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#888888] hover:text-[#00ff88] transition-all duration-300 hover:scale-110"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-[#1a1a1a] text-center">
          <p className="text-[#666666] text-sm">
            © 2025 Acuvity. Advanced Solana Analytics Platform.
          </p>
        </div>
      </div>
    </footer>
  );
}