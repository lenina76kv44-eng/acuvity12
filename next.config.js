/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'cdn.dexscreener.com' },
      { protocol: 'https', hostname: 'assets.dexscreener.com' },
      { protocol: 'https', hostname: 'assets.coingecko.com' },
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: 'cloudflare-ipfs.com' }
    ],
    // IMPORTANT: Bolt preview can't use Next optimizer reliably
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;