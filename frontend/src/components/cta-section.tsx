"use client"

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { ArrowRight } from "lucide-react"

export function CTASection() {
  const { address } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
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
              className="inline-flex items-center justify-center bg-white text-black hover:bg-gray-100 font-bold text-base px-8 py-3 rounded-lg transition-colors"
            >
              Launch Your Vault <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          ) : mounted && !address ? (
            <div className="inline-flex items-center justify-center bg-white/50 text-black/50 font-bold text-base px-8 py-3 rounded-lg cursor-not-allowed">
              Connect Wallet to Launch <ArrowRight className="ml-2 h-5 w-5" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center bg-white/50 text-black/50 font-bold text-base px-8 py-3 rounded-lg">
              Loading... <ArrowRight className="ml-2 h-5 w-5" />
            </div>
          )}
          <Link
            href="/vaults"
            className="inline-flex items-center justify-center border border-white/30 text-white hover:bg-white/10 font-bold bg-transparent px-8 py-3 rounded-lg transition-colors"
          >
            Browse Vaults
          </Link>
        </div>
      </div>
    </section>
  )
}
