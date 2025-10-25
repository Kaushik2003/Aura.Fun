'use client'

import { VaultState } from '../../types/vault'
import { formatEther } from 'viem'
import { formatAddress, formatPercentage, formatNumber } from '../../lib/utils'
import { calculateHealth } from '../../lib/calculations'

interface FanVaultMetricsProps {
    vault: VaultState
}

export function FanVaultMetrics({ vault }: FanVaultMetricsProps) {
    // Calculate derived metrics
    const healthPercentage = calculateHealth(vault.totalCollateral, vault.totalSupply, vault.peg)
    const pegInCelo = Number(formatEther(vault.peg))
    const tvl = Number(formatEther(vault.totalCollateral))
    const supplyUtilization = vault.supplyCap > 0n
        ? (Number(vault.totalSupply) / Number(vault.supplyCap)) * 100
        : 0

    // Health color coding
    const getHealthColor = (health: number) => {
        if (health >= 150) return 'text-green-600 bg-green-50 border-green-200'
        if (health >= 120) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        return 'text-red-600 bg-red-50 border-red-200'
    }

    // Stage progress calculation
    const stageRequirements = [0, 100, 500, 2500, 10000] // CELO requirements for each stage
    const currentStageReq = stageRequirements[vault.stage] || 0
    const nextStageReq = vault.stage < 4 ? stageRequirements[vault.stage + 1] : null
    const creatorCollateralCelo = Number(formatEther(vault.creatorCollateral))

    return (
        <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Investment Overview</h2>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Health Ratio */}
                <div className={`p-4 rounded-lg border ${getHealthColor(healthPercentage)}`}>
                    <div className="text-sm font-medium opacity-75">Health Ratio</div>
                    <div className="text-2xl font-bold">
                        {formatPercentage(healthPercentage, 0)}
                    </div>
                    <div className="text-xs mt-1">
                        {healthPercentage >= 150 ? 'Healthy' : healthPercentage >= 120 ? 'Warning' : 'Liquidatable'}
                    </div>
                </div>

                {/* Token Price */}
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="text-sm font-medium text-gray-600">Token Price</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {pegInCelo.toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">CELO per token</div>
                </div>

                {/* Total Value Locked */}
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="text-sm font-medium text-gray-600">Total Value Locked</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {formatNumber(tvl, 1)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">CELO</div>
                </div>

                {/* Aura Score */}
                <div className="p-4 rounded-lg border border-purple-200 bg-purple-50">
                    <div className="text-sm font-medium text-purple-600">Aura Score</div>
                    <div className="text-2xl font-bold text-purple-900">
                        {vault.aura}
                    </div>
                    <div className="text-xs text-purple-500 mt-1">out of 200</div>
                </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Collateral Breakdown */}
                <div>
                    <h3 className="text-lg font-medium mb-3">Collateral Breakdown</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Creator Collateral:</span>
                            <span className="font-semibold">{formatEther(vault.creatorCollateral)} CELO</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Fan Collateral:</span>
                            <span className="font-semibold">{formatEther(vault.fanCollateral)} CELO</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                            <span className="text-gray-900 font-medium">Total Collateral:</span>
                            <span className="font-bold">{formatEther(vault.totalCollateral)} CELO</span>
                        </div>
                    </div>
                </div>

                {/* Supply Information */}
                <div>
                    <h3 className="text-lg font-medium mb-3">Supply Information</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Current Supply:</span>
                            <span className="font-semibold">{formatNumber(Number(formatEther(vault.totalSupply)))}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Supply Cap:</span>
                            <span className="font-semibold">{formatNumber(Number(formatEther(vault.supplyCap)))}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Utilization:</span>
                            <span className="font-semibold">{formatPercentage(supplyUtilization, 1)}</span>
                        </div>

                        {/* Supply Utilization Bar */}
                        <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Supply Utilization</span>
                                <span>{formatPercentage(supplyUtilization, 0)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min(supplyUtilization, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Creator and Stage Information */}
            <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Creator Info */}
                    <div>
                        <h3 className="text-lg font-medium mb-3">Creator Information</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Creator Address:</span>
                                <span className="font-mono text-sm">{formatAddress(vault.creator)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Token Symbol:</span>
                                <span className="font-semibold">${vault.tokenSymbol}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stage Progress */}
                    <div>
                        <h3 className="text-lg font-medium mb-3">Stage Progress</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Current Stage:</span>
                                <span className="font-semibold">{vault.stage}/4</span>
                            </div>

                            {vault.stage > 0 && nextStageReq && (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Next Stage Requirement:</span>
                                        <span className="font-semibold">{nextStageReq} CELO</span>
                                    </div>

                                    {/* Stage Progress Bar */}
                                    <div className="mt-2">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Progress to Stage {vault.stage + 1}</span>
                                            <span>{Math.min(100, (creatorCollateralCelo / nextStageReq) * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-purple-600 h-2 rounded-full transition-all"
                                                style={{
                                                    width: `${Math.min(100, (creatorCollateralCelo / nextStageReq) * 100)}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {vault.stage === 4 && (
                                <div className="text-center py-2">
                                    <span className="text-sm font-semibold text-purple-600">✓ Maximum Stage Reached</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}