"use client";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { Mail, MessageCircle, Twitter, Globe, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-4">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs />
        
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Get in <span className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Have questions about Acuvity? Need support with our tools? We're here to help you navigate the world of blockchain analytics.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Information */}
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-[#00ff88] mb-6">Contact Information</h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#00ff88]/10 rounded-xl flex items-center justify-center">
                  <Twitter className="w-6 h-6 text-[#00ff88]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Follow us on X</h3>
                  <a 
                    href="https://x.com/AcuvityAI" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#00ff88] hover:text-[#00cc6a] transition-colors"
                  >
                    @AcuvityAI
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#00ff88]/10 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-[#00ff88]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Website</h3>
                  <p className="text-gray-400">acuvityai.org</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#00ff88]/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[#00ff88]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Based in</h3>
                  <p className="text-gray-400">Global • Decentralized</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#00ff88]/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#00ff88]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Response Time</h3>
                  <p className="text-gray-400">Usually within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-[#00ff88] mb-6">Send us a Message</h2>
            
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full rounded-xl bg-gray-800/50 border border-gray-600 px-4 py-3 text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-[#00ff88] transition-all duration-200"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full rounded-xl bg-gray-800/50 border border-gray-600 px-4 py-3 text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-[#00ff88] transition-all duration-200"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-white mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  className="w-full rounded-xl bg-gray-800/50 border border-gray-600 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-[#00ff88] transition-all duration-200"
                >
                  <option value="">Select a topic</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-white mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="w-full rounded-xl bg-gray-800/50 border border-gray-600 px-4 py-3 text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-[#00ff88] transition-all duration-200 resize-none"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#00ff88] hover:bg-[#00cc6a] text-black px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#00ff88]/25"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-[#00ff88]" />
              <h3 className="text-xl font-bold text-white">Community Support</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Join our community discussions and get help from other users and our team.
            </p>
            <a
              href="https://x.com/AcuvityAI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00ff88] hover:text-[#00cc6a] font-semibold transition-colors"
            >
              Join Community →
            </a>
          </div>

          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-[#00ff88]" />
              <h3 className="text-xl font-bold text-white">Documentation</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Check out our comprehensive FAQ section for quick answers to common questions.
            </p>
            <a
              href="/faq"
              className="text-[#00ff88] hover:text-[#00cc6a] font-semibold transition-colors"
            >
              View FAQ →
            </a>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Ready to start analyzing?</h3>
            <p className="text-gray-400 mb-6">
              Don't wait for a response - all our tools are available right now, completely free.
            </p>
            <a
              href="/twitter-search"
              className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 inline-block"
            >
              Start Analyzing
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}