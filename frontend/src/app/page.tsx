'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { useEffect, useState } from 'react'
import { Navigation } from "../components/navigation"
import { useVaults } from "../../hooks/use-vaults"

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Welcome to <span className="text-yellow-300">AuraFi</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              The decentralized platform where creators launch tokenized vaults backed by dual collateral,
              and fans invest in their favorite creators' success.
            </p>
            <p className="text-lg mb-12 text-blue-200 max-w-2xl mx-auto">
              Creator tokens with dynamic pricing based on engagement metrics.
              Secure 150% collateralization. Real-time aura scoring.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/vaults"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
              >
                Browse Creator Vaults
              </Link>
              {mounted && address && (
                <Link
                  href="/creator/create"
                  className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors shadow-lg"
                >
                  Create Your Vault
                </Link>
              )}
              {mounted && !address && (
                <div className="bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg opacity-75">
                  Connect Wallet to Create
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Protocol Overview
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real-time metrics from the AuraFi ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center bg-gray-50 rounded-lg p-8">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {!mounted || isLoading ? '...' : totalVaults}
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">
                Total Vaults
              </div>
              <div className="text-sm text-gray-600">
                Creator vaults deployed
              </div>
            </div>

            <div className="text-center bg-gray-50 rounded-lg p-8">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {!mounted || isLoading ? '...' : `${parseFloat(formatEther(totalTVL)).toFixed(0)}`}
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">
                Total Value Locked
              </div>
              <div className="text-sm text-gray-600">
                CELO in collateral
              </div>
            </div>

            <div className="text-center bg-gray-50 rounded-lg p-8">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {!mounted || isLoading ? '...' : activeVaults}
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">
                Active Vaults
              </div>
              <div className="text-sm text-gray-600">
                Bootstrapped & minting
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How AuraFi Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A simple three-step process for creators and fans
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Creators Deploy Vaults
              </h3>
              <p className="text-gray-600">
                Launch your creator token with custom name, symbol, and Farcaster integration.
                Bootstrap with 0.001 CELO to unlock fan minting.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Fans Mint Tokens
              </h3>
              <p className="text-gray-600">
                Invest in creators by minting their tokens with 150% CELO collateralization.
                Token prices reflect creator engagement through aura scores.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Dynamic Value Growth
              </h3>
              <p className="text-gray-600">
                Aura scores (0-200) update based on Farcaster engagement,
                dynamically adjusting token prices and supply caps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join the creator economy revolution. Whether you're a creator looking to tokenize
            your community or a fan wanting to support your favorites, AuraFi has you covered.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vaults"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
            >
              Explore Creator Vaults
            </Link>
            {mounted && address ? (
              <Link
                href="/creator/create"
                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors"
              >
                Launch Your Vault
              </Link>
            ) : mounted && !address ? (
              <div className="bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg opacity-75">
                Connect Wallet to Create
              </div>
            ) : (
              <div className="bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg opacity-75">
                Loading...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4">
            <span className="text-2xl font-bold">AuraFi</span>
          </div>
          <p className="text-gray-400 mb-4">
            Decentralized creator tokens backed by dual collateral
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <Link href="/vaults" className="hover:text-white transition-colors">
              Browse Vaults
            </Link>
            <Link href="/liquidate" className="hover:text-white transition-colors">
              Liquidate
            </Link>
            {mounted && address && (
              <Link href="/creator" className="hover:text-white transition-colors">
                Creator Dashboard
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
