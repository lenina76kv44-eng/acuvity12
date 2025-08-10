import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bags Finder - Twitter to Wallet & Token CA to Creators',
  description: 'Clean, simple tool to search Bags.fm data. Find wallet mappings by Twitter handle or discover creators and fee shares by token contract address.',
  keywords: ['Bags', 'Bags.fm', 'Twitter', 'Wallet', 'Token', 'Creators', 'Solana'],
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
      <body className="font-inter antialiased">{children}</body>
    </html>
  );
}