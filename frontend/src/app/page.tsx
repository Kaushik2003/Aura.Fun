'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { useEffect, useState } from 'react'
import { Navigation } from "../components/navigation"
import { useVaults } from "../../hooks/use-vaults"
import { Sparkles, Rocket, Users, TrendingUp, Shield, Zap, BarChart3 } from "lucide-react"

export default function Home() {
  const { address } = useAccount()
  const { vaults, isLoading } = useVaults()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate key metrics
  const totalVaults = vaults?.length || 0
  const totalTVL = vaults?.reduce((sum, vault) => sum + vault.totalCollateral, 0n) || 0n
  const activeVaults = vaults?.filter(vault => vault.stage > 0).length || 0

  const features = [
    {
      icon: Rocket,
      title: "Instant Launch",
      description: "Deploy your creator token in seconds with customizable parameters and automatic collateral management.",
    },
    {
      icon: Users,
      title: "Community Minting",
      description: "Fans mint tokens by providing collateral, creating sustainable economic models for creator growth.",
    },
    {
      icon: TrendingUp,
      title: "Dynamic Pricing",
      description: "Aura-based peg system ensures fair pricing that reflects community engagement and vault health.",
    },
    {
      icon: Shield,
      title: "Collateral Protection",
      description: "Multi-stage vault progression with health monitoring keeps the ecosystem stable and secure.",
    },
    {
      icon: Zap,
      title: "Stage Progression",
      description: "Unlock new capacity tiers as your community grows, rewarding early supporters and creators.",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Monitor vault performance, community metrics, and token economics with live dashboards.",
    },
  ]

  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden px-6 py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-black" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-400/10 px-4 py-2 backdrop-blur">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300 font-semibold">Welcome to the future of social DeFi</span>
          </div>

          <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-white leading-tight">
            Creator Tokens
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Powered by Aura
            </span>
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Launch collateral-backed fan tokens on Celo. Build communities, earn rewards, and create sustainable creator
            economies with transparent, decentralized infrastructure.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              href="/vaults"
              className="inline-flex items-center justify-center bg-white text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 shadow-lg transition-all"
            >
              Browse Creator Vaults
            </Link>

            {mounted && address ? (
              <Link
                href="/creator/create"
                className="inline-flex items-center justify-center bg-emerald-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-emerald-600 shadow-lg transition-all"
              >
                Create Your Vault
              </Link>
            ) : mounted && !address ? (
              <div className="inline-flex items-center justify-center bg-gray-700 text-gray-300 px-8 py-4 rounded-lg font-bold text-lg cursor-not-allowed">
                Connect Wallet to Create
              </div>
            ) : (
              <div className="inline-flex items-center justify-center bg-gray-700 text-gray-300 px-8 py-4 rounded-lg font-bold text-lg">
                Loading...
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-16 border-t border-white/10">
            <div>
              <div className="text-3xl md:text-4xl font-black text-white">
                {!mounted || isLoading ? '...' : totalVaults}
              </div>
              <p className="text-sm text-gray-400 mt-2">Total Vaults</p>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-white">
                {!mounted || isLoading ? '...' : `${parseFloat(formatEther(totalTVL)).toFixed(0)}`}
              </div>
              <p className="text-sm text-gray-400 mt-2">CELO Locked</p>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-white">
                {!mounted || isLoading ? '...' : activeVaults}
              </div>
              <p className="text-sm text-gray-400 mt-2">Active Vaults</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative bg-black border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-6xl md:text-7xl font-black text-white tracking-tight">Powerful Features</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to launch and manage your creator token ecosystem
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8 hover:border-emerald-400/50 hover:bg-white/10 transition-all duration-300"
              >
                <feature.icon className="h-12 w-12 text-emerald-400 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative bg-black border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-6xl md:text-7xl font-black text-white tracking-tight">How It Works</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              A simple three-step process for creators and fans
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/50">
                <span className="text-3xl font-black text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Creators Deploy Vaults</h3>
              <p className="text-gray-400 leading-relaxed">
                Launch your creator token with custom name, symbol, and Farcaster integration.
                Bootstrap with 0.001 CELO to unlock fan minting.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/50">
                <span className="text-3xl font-black text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Fans Mint Tokens</h3>
              <p className="text-gray-400 leading-relaxed">
                Invest in creators by minting their tokens with 150% CELO collateralization.
                Token prices reflect creator engagement through aura scores.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/50">
                <span className="text-3xl font-black text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Dynamic Value Growth</h3>
              <p className="text-gray-400 leading-relaxed">
                Aura scores (0-200) update based on Farcaster engagement,
                dynamically adjusting token prices and supply caps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-black border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-4xl text-center space-y-10">
          <h2 className="text-6xl md:text-7xl font-black text-white tracking-tight">Ready to Launch?</h2>
          <p className="text-xl text-gray-300 leading-relaxed">
            Join thousands of creators building the future of fan engagement on Celo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {mounted && address ? (
              <Link
                href="/creator/create"
                className="inline-flex items-center justify-center bg-white text-black hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-lg transition-all shadow-lg"
              >
                Launch Your Vault
              </Link>
            ) : mounted && !address ? (
              <div className="inline-flex items-center justify-center bg-white/50 text-black/50 font-bold text-lg px-8 py-4 rounded-lg cursor-not-allowed">
                Connect Wallet to Launch
              </div>
            ) : (
              <div className="inline-flex items-center justify-center bg-white/50 text-black/50 font-bold text-lg px-8 py-4 rounded-lg">
                Loading...
              </div>
            )}
            <Link
              href="/vaults"
              className="inline-flex items-center justify-center border border-white/30 text-white hover:bg-white/10 font-bold bg-transparent px-8 py-4 rounded-lg transition-all"
            >
              Browse Vaults
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/50 backdrop-blur px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-black font-bold" />
                </div>
                <span className="font-bold text-white text-xl">AuraFun</span>
              </div>
              <p className="text-sm text-gray-400">Creator tokens on Celo</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link href="/vaults" className="hover:text-white transition font-medium">
                    Browse Vaults
                  </Link>
                </li>
                <li>
                  <Link href="/creator/create" className="hover:text-white transition font-medium">
                    Create Vault
                  </Link>
                </li>
                <li>
                  <Link href="/liquidate" className="hover:text-white transition font-medium">
                    Liquidate
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition font-medium">
                    Docs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition font-medium">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition font-medium">
                    Community
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition font-medium">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition font-medium">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition font-medium">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400 gap-4">
            <p>&copy; 2025 AuraFun. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition font-medium">
                Twitter
              </a>
              <a href="#" className="hover:text-white transition font-medium">
                Discord
              </a>
              <a href="#" className="hover:text-white transition font-medium">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
