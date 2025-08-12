"use client";
import { useState } from "react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { ChevronDown, ChevronUp, Search, Users, BarChart3, Coins, Shield, Zap } from "lucide-react";

const faqs = [
  {
    category: "General",
    icon: Shield,
    questions: [
      {
        question: "What is Acuvity?",
        answer: "Acuvity is an advanced Solana wallet analytics platform that helps users discover connections, analyze risks, and track memecoin activity. We provide AI-powered insights for blockchain intelligence and security analysis."
      },
      {
        question: "How does Acuvity work?",
        answer: "Acuvity analyzes on-chain Solana transactions using advanced algorithms and AI. We scan wallet addresses, detect patterns, identify connections between wallets, and provide risk assessments based on transaction history and behavioral analysis."
      },
      {
        question: "Is Acuvity free to use?",
        answer: "Yes! All our core tools are completely free to use. You can analyze wallets, find creators, check reliability scores, and discover connections without any registration or payment required."
      },
      {
        question: "Do I need to connect my wallet?",
        answer: "No, you don't need to connect any wallet. Acuvity is a read-only analytics platform. You simply enter wallet addresses or X (Twitter) handles to analyze, and we provide the insights."
      }
    ]
  },
  {
    category: "X Search Tool",
    icon: Search,
    questions: [
      {
        question: "How does X Search work?",
        answer: "X Search finds wallet addresses associated with X (Twitter) handles through the Bags.fm ecosystem. Enter an X handle (like @username) and we'll show you the mapped wallet address, balance, and any BAGS tokens associated with that creator."
      },
      {
        question: "Why can't I find some X handles?",
        answer: "X Search only works for creators who have launched tokens on Bags.fm and linked their X accounts. If someone hasn't created tokens on Bags or hasn't linked their X account, they won't appear in our database."
      },
      {
        question: "What are BAGS tokens?",
        answer: "BAGS tokens are memecoins launched through the Bags.fm platform. These tokens typically end with 'BAGS' in their mint address and are part of the Bags ecosystem for creator monetization."
      }
    ]
  },
  {
    category: "CA Finder",
    icon: Users,
    questions: [
      {
        question: "What is CA Finder?",
        answer: "CA Finder (Contract Address Finder) analyzes token contract addresses to discover creators, fee structures, and royalty distributions. Enter any Solana token contract address to see who created it and how fees are split."
      },
      {
        question: "What information does CA Finder show?",
        answer: "CA Finder reveals token creators, their X (Twitter) handles, wallet addresses, royalty percentages, and whether they're the primary creator or fee recipient. This helps identify the people behind any token."
      },
      {
        question: "Can I analyze any Solana token?",
        answer: "CA Finder works best with tokens from the Bags.fm ecosystem, but it can analyze any Solana token contract. Results depend on whether creator information is available in the Bags database."
      }
    ]
  },
  {
    category: "Wallet Reliability Check",
    icon: Coins,
    questions: [
      {
        question: "How does the AI reliability scoring work?",
        answer: "Our AI analyzes wallet transaction history, including age, balance, transaction patterns, counterparties, and BAGS token activity. It provides a reliability score from 1-100 with detailed insights about the wallet's behavior and risk factors."
      },
      {
        question: "What makes a wallet reliable?",
        answer: "Reliable wallets typically have: longer account age, consistent transaction history, diverse counterparties, meaningful SOL balance, regular activity patterns, and legitimate token interactions. Our AI considers all these factors."
      },
      {
        question: "How many transactions does the analysis cover?",
        answer: "By default, we analyze up to 500 recent transactions (5 pages × 100 transactions). You can adjust this from 1-10 pages depending on how deep you want the analysis to go."
      },
      {
        question: "Is the reliability score always accurate?",
        answer: "The AI reliability score is a helpful indicator based on on-chain data patterns, but it's not financial advice. Always do your own research and consider multiple factors when evaluating wallets or making decisions."
      }
    ]
  },
  {
    category: "Wallet → X Tags",
    icon: BarChart3,
    questions: [
      {
        question: "What is Wallet → X Tags?",
        answer: "This is a reverse lookup tool that finds X (Twitter) handles associated with a wallet address. Enter any Solana wallet address and discover what X accounts are linked to it through Bags creator data."
      },
      {
        question: "How is this different from X Search?",
        answer: "X Search goes from X handle → wallet address, while Wallet → X Tags goes from wallet address → X handles. They're reverse operations of each other, useful for different investigation scenarios."
      },
      {
        question: "Why might a wallet show no X tags?",
        answer: "A wallet will show no X tags if: the owner hasn't created tokens on Bags.fm, hasn't linked their X account, or the wallet isn't associated with any creator activities in our database."
      }
    ]
  },
  {
    category: "Technical",
    icon: Zap,
    questions: [
      {
        question: "What blockchain does Acuvity support?",
        answer: "Currently, Acuvity focuses exclusively on Solana blockchain analysis. We use Helius RPC for transaction data and integrate with the Bags.fm ecosystem for creator information."
      },
      {
        question: "How often is the data updated?",
        answer: "Our data is real-time and pulled directly from the Solana blockchain via Helius RPC. Transaction analysis and wallet information are always current when you perform a search."
      },
      {
        question: "Do you store my search history?",
        answer: "No, we don't store your search queries or results. Each analysis is performed in real-time and not saved. Your privacy and anonymity are important to us."
      },
      {
        question: "Can I use Acuvity for commercial purposes?",
        answer: "Yes, you can use Acuvity for research, due diligence, and commercial analysis. However, always comply with applicable laws and regulations in your jurisdiction."
      }
    ]
  }
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] bg-clip-text text-transparent">Questions</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to know about Acuvity's blockchain analytics tools and features.
          </p>
        </header>

        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => {
            const Icon = category.icon;
            return (
              <div key={category.category} className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#00ff88] rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#00ff88]">{category.category}</h2>
                </div>
                
                <div className="space-y-4">
                  {category.questions.map((faq, questionIndex) => {
                    const itemId = `${categoryIndex}-${questionIndex}`;
                    const isOpen = openItems.includes(itemId);
                    
                    return (
                      <div key={itemId} className="border border-gray-700/50 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800/30 transition-colors duration-200"
                        >
                          <span className="font-semibold text-white">{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-[#00ff88] flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        
                        {isOpen && (
                          <div className="px-6 pb-4 border-t border-gray-700/50">
                            <p className="text-gray-300 leading-relaxed pt-4">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
            <p className="text-gray-400 mb-6">
              Can't find what you're looking for? Reach out to our team for additional support.
            </p>
            <a
              href="/contact"
              className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 inline-block"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}