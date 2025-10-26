'use client'

import { useVaults } from '../../../hooks/use-vaults'
import { LiquidationCard } from '../../components/liquidation-card'
import { VaultCardSkeleton } from '../../components/vault-card-skeleton'
import { VaultState } from '../../../types/vault'

export default function LiquidatePage() {
    const { vaults, isLoading, error } = useVaults()

    // Filter vaults with health < 120%
    const liquidatableVaults = vaults?.filter(vault => {
        const healthPercentage = Number(vault.health) / 1e16 // Convert from wei percentage to regular percentage
        return healthPercentage < 120
    }) || []

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black pt-24">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-white">Liquidation Dashboard</h1>
                        <p className="text-gray-400">Restore vault health and earn bounties</p>
                    </div>
                    <VaultCardSkeleton count={3} />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black pt-24">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-white">Liquidation Dashboard</h1>
                        <p className="text-gray-400">Restore vault health and earn bounties</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 backdrop-blur">
                        <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Vaults</h3>
                        <p className="text-red-300">Failed to load vault data. Please try again later.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black pt-24">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white">Liquidation Dashboard</h1>
                    <p className="text-gray-400">Restore vault health and earn bounties</p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Total Vaults</h3>
                        <p className="text-2xl font-bold text-white">{vaults?.length || 0}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Liquidatable Vaults</h3>
                        <p className="text-2xl font-bold text-red-400">{liquidatableVaults.length}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Liquidation Rate</h3>
                        <p className="text-2xl font-bold text-red-400">
                            {vaults?.length ? ((liquidatableVaults.length / vaults.length) * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                </div>

                {/* Liquidatable Vaults */}
                {liquidatableVaults.length === 0 ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-8 text-center backdrop-blur">
                        <div className="text-emerald-400 text-4xl mb-4">✅</div>
                        <h3 className="text-xl font-bold text-emerald-400 mb-2">All Vaults Healthy</h3>
                        <p className="text-emerald-300">
                            No vaults currently need liquidation. All vaults have health ratios above 120%.
                        </p>
                        <p className="text-sm text-emerald-400/70 mt-2">
                            Check back later for liquidation opportunities.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">
                                Liquidatable Vaults ({liquidatableVaults.length})
                            </h2>
                            <div className="text-sm text-gray-400">
                                Sorted by health ratio (lowest first)
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {liquidatableVaults
                                .sort((a, b) => {
                                    const healthA = Number(a.health) / 1e16
                                    const healthB = Number(b.health) / 1e16
                                    return healthA - healthB // Lowest health first
                                })
                                .map(vault => (
                                    <LiquidationCard key={vault.address} vault={vault} />
                                ))}
                        </div>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-12 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 backdrop-blur">
                    <h3 className="text-lg font-semibold text-blue-400 mb-3">How Liquidation Works</h3>
                    <div className="space-y-2 text-sm text-blue-300">
                        <p>• <strong className="text-blue-200">Liquidation Threshold:</strong> Vaults become liquidatable when health drops below 120%</p>
                        <p>• <strong className="text-blue-200">Your Reward:</strong> Earn 1% bounty on the CELO you inject to restore vault health</p>
                        <p>• <strong className="text-blue-200">Creator Penalty:</strong> Creator loses 10% of their collateral (capped at 20% of your payment)</p>
                        <p>• <strong className="text-blue-200">Target Health:</strong> Liquidation must restore vault health to at least 150%</p>
                        <p>• <strong className="text-blue-200">Token Removal:</strong> Excess tokens are burned to restore proper collateralization</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
