# Bags Finder

A clean, simple tool to search Bags.fm data. Find wallet mappings by Twitter handle or discover creators and fee shares by token contract address.

![Bags Finder](https://i.imgur.com/KQRAG1D.png)

## Features

- **Twitter to Wallet**: Enter a Twitter handle to find the mapped wallet address
- **Token CA to Creators**: Enter a token contract address to discover creators and fee shares
- **Clean UI**: Modern, responsive design with dark theme
- **Real-time Search**: Instant results with loading states and error handling

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Bags.fm API** - Data source

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bags-finder.git
cd bags-finder
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions on deploying to Vercel.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/bags-finder)

## API Usage

This application uses the Bags.fm public API:

- **Twitter to Wallet**: `/api/v1/token-launch/fee-share/wallet/twitter`
- **Token to Creators**: `/api/v1/token-launch/creator/v2`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Bags.fm](https://bags.fm) for providing the API
- [Vercel](https://vercel.com) for hosting
- [Tailwind CSS](https://tailwindcss.com) for styling