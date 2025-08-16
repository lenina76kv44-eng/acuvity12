"use client";
import Link from 'next/link';

export default function Footer() {
          {/* <button
            onClick={() => {
              if (typeof (window as any).startConnect === 'function') {
                (window as any).startConnect();
              } else {
                console.error('startConnect function not found. Script may not be loaded yet.');
                // Попробуем подождать и повторить
                setTimeout(() => {
                  if (typeof (window as any).startConnect === 'function') {
                    (window as any).startConnect();
                  } else {
                    console.error('startConnect function still not available after delay');
                  }
                }, 1000);
              }
            }}
            className="text-[#888888] hover:text-[#00ff88] transition-all duration-300 font-medium hover:scale-105"
          >
            Connect
          </button> */}

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/api-docs"
              className="text-[#888888] hover:text-[#00ff88] transition-all duration-300 font-medium hover:scale-105"
            >
              API
            </Link>
            <Link
              href="/faq"
              className="text-[#888888] hover:text-[#00ff88] transition-all duration-300 font-medium hover:scale-105"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="text-[#888888] hover:text-[#00ff88] transition-all duration-300 font-medium hover:scale-105"
            >
              Contact
            </Link>
            <button
              onClick={() => {
                if (typeof (window as any).startConnect === 'function') {
                  (window as any).startConnect();
                } else {
                  console.error('startConnect function not found. Script may not be loaded yet.');
                  // Попробуем подождать и повторить
                  setTimeout(() => {
                    if (typeof (window as any).startConnect === 'function') {
                      (window as any).startConnect();
                    } else {
                      console.error('startConnect function still not available after delay');
                    }
                  }, 1000);
                }
              }}
              className="text-[#888888] hover:text-[#00ff88] transition-all duration-300 font-medium hover:scale-105"
            >
              Connect
            </button>
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