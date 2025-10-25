'use client'

import Link from 'next/link'
import { formatEther } from 'viem'
import { VaultState } from '../../types/vault'
import { formatAddress, formatNumber, formatPercentage, cn } from '../../lib/utils'

interface FanVaultCardProps {
    vault: VaultState
}

export function FanVaultCard({ vault }: FanVaultCardProps) {
    // Calculate display values
    const healthPercentage = Number(vault.health) / 1e16 // Convert from wei percentage to regular percentage
    const tvlInCelo = Number(formatEther(vault.totalCollateral))
    const pegInCelo = Number(formatEther(vault.peg))
    const supplyCapacityUsed = vault.supplyCap > 0n
        ? (Number(vault.totalSupply) / Number(vault.supplyCap)) * 100
        : 0

    // Health color coding
    const healthColor =
        healthPercentage >= 150 ? 'text-green-600' :
            healthPercentage >= 120 ? 'text-yellow-600' :
                'text-red-600'

    const healthBgColor =
        healthPercentage >= 150 ? 'bg-green-50 border-green-200' :
            healthPercentage >= 120 ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'

    // Stage status
    const stageStatus = vault.stage === 0 ? 'Not Active' : `Stage ${vault.stage}/4`
    const stageColor = vault.stage === 0 ? 'text-gray-500' : 'text-blue-600'

    // Aura color coding
    const auraColor =
        vault.aura >= 150 ? 'text-purple-600' :
            vault.aura >= 100 ? 'text-blue-600' :
                vault.aura >= 50 ? 'text-yellow-600' :
                    'text-red-600'

    return (
        <Link href={`/vaults/${vault.address}`}>
            <div className="border rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer bg-white hover:border-blue-300">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold truncate">{vault.tokenName}</h3>
                        <p className="text-sm text-gray-600 font-mono">${vault.tokenSymbol}</p>
                    </div>
                    <div className="text-right ml-4">
                        <p className={`text-sm font-medium ${stageColor}`}>{stageStatus}</p>
                        <div className={`inline-flex items-center px-2 py-1 rounded text-sm font-semibold border ${healthBgColor} ${healthColor}`}>
                            {healthPercentage.toFixed(0)}%
                        </div>
                    </div>
                </div>

                {/* Creator Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Creator:</span>
                        <span className="font-mono text-gray-800">{formatAddress(vault.creator)}</span>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Aura Score:</span>
                        <div className="flex items-center gap-2">
                            <span className={`font-semibold ${auraColor}`}>{vault.aura}</span>
                            <span className="text-gray-400 text-xs">/200</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Token Price:</span>
                        <span className="font-semibold">{pegInCelo.toFixed(4)} CELO</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">TVL:</span>
                        <span className="font-semibold">{formatNumber(tvlInCelo)} CELO</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Supply:</span>
                        <span className="font-semibold">
                            {formatNumber(Number(formatEther(vault.totalSupply)))} tokens
                        </span>
                    </div>
                </div>

                {/* Supply Capacity Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Supply Capacity</span>
                        <span>{supplyCapacityUsed.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={cn(
                                'h-2 rounded-full transition-all duration-300',
                                supplyCapacityUsed >= 90 ? 'bg-red-500' :
                                    supplyCapacityUsed >= 70 ? 'bg-yellow-500' :
                                        'bg-blue-500'
                            )}
                            style={{ width: `${Math.min(supplyCapacityUsed, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Status Indicators */}
                <div className="flex flex-wrap gap-2">
                    {vault.stage === 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Needs Bootstrap
                        </span>
                    )}

                    {vault.pendingForcedBurn > 0n && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                            ⚠️ Forced Burn
                        </span>
                    )}

                    {healthPercentage < 120 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                            🔥 Liquidatable
                        </span>
                    )}

                    {vault.aura >= 150 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                            ⭐ High Aura
                        </span>
                    )}

                    {supplyCapacityUsed >= 90 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                            📈 Near Cap
                        </span>
                    )}
                </div>

                {/* Investment Appeal Indicator */}
                <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Investment Appeal:</span>
                        <div className="flex items-center gap-1">
                            {/* Simple scoring based on health, aura, and stage */}
                            {Array.from({ length: 5 }, (_, i) => {
                                const score = Math.min(5, Math.floor(
                                    (healthPercentage / 30) + // Health contribution (max 5)
                                    (vault.aura / 40) + // Aura contribution (max 5)
                                    (vault.stage * 1) // Stage contribution (max 4)
                                ) / 3)
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            'w-2 h-2 rounded-full',
                                            i < score ? 'bg-blue-500' : 'bg-gray-200'
                                        )}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}