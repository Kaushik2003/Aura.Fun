'use client'

import { useAccount } from 'wagmi'
import { useCreatorVaults } from '../../../hooks/use-creator-vaults'
import { CreatorVaultCard } from '../../components/creator-vault-card'
import { CreatorStats } from '../../components/creator-stats'
import Link from 'next/link'

export default function CreatorDashboardPage() {
    const { address } = useAccount()
    const { vaults, isLoading, stats } = useCreatorVaults(address)

    if (!address) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                    <p className="text-gray-600">Connect your wallet to view your creator dashboard</p>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="h-48 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Creator Dashboard</h1>
                <Link
                    href="/creator/create"
                    className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors"
                >
                    Create New Vault
                </Link>
            </div>

            {stats && <CreatorStats stats={stats} />}

            {vaults && vaults.length === 0 ? (
                <div className="border rounded-lg p-8 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">No Vaults Yet</h3>
                        <p className="text-gray-600 mb-4">
                            Create your first vault to start building your creator economy and engage with your fans through tokenized support.
                        </p>
                        <Link
                            href="/creator/create"
                            className="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors"
                        >
                            Create Your First Vault
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Your Vaults</h2>
                        <p className="text-gray-600">{vaults?.length} vault{vaults?.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {vaults?.map(vault => (
                            <CreatorVaultCard key={vault.address} vault={vault} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}