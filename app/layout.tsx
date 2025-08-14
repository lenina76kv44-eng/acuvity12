import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/navigation/Header';
import Footer from '@/components/navigation/Footer';
import ScriptLoader from '@/components/ScriptLoader';

export const metadata: Metadata = {
  title: 'Acuvity — Advanced Solana Analytics',
  description: 'Advanced Solana wallet scanner — detect links, track memecoin activity, avoid rugs. AI-powered blockchain analytics.',
  keywords: ['Acuvity', 'Solana', 'Analytics', 'Blockchain', 'AI', 'Wallet', 'Scanner', 'DeFi', 'Web3'],
  authors: [{ name: 'Acuvity' }],
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: 'https://i.imgur.com/jcLZvxY.png',
    apple: 'https://i.imgur.com/jcLZvxY.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-inter antialiased">
        {/* Animated Background */}
        <div className="animated-bg">
          <div className="grid-pattern"></div>
          {Array.from({ length: 25 }, (_, i) => (
            <div key={i} className="bubble"></div>
          ))}
        </div>
        
        <Header />
        {children}
        <Footer />
        <ScriptLoader />
      </body>
    </html>
  );
}