import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/navigation/Header';

export const metadata: Metadata = {
  title: 'Bags Finder — XFinder & CA Finder',
  description: 'Find wallets by X handles, and find creators by token CA. Clean Solana discovery.',
  keywords: ['Bags', 'Bags.fm', 'X', 'Twitter', 'Wallet', 'Token', 'Creators', 'Solana', 'Find'],
  authors: [{ name: 'Bags Finder' }],
  viewport: 'width=device-width, initial-scale=1',
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
        <Header />
        {children}
      </body>
    </html>
  );
}