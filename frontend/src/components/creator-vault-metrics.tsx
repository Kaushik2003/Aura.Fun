'use client'

import { VaultState } from '../../types/vault'
import { formatEther } from 'viem'
import { formatAddress, formatPercentage, formatNumber } from '../../lib/utils'
import { calculateHealth } from '../../lib/calculations'

interface CreatorVaultMetricsProps {
    vault: VaultState
}

export function CreatorVaultMetrics({ vault }: CreatorVaultMetricsProps) {
    // Calculate derived metrics
    const healthPercentage = calculateHealth(vault.totalCollateral, vault.totalSupply, vault.peg)
    const pegInCelo = Number(formatEther(vault.peg))
    const tvl = Number(formatEther(vault.totalCollateral))
    const creatorCollateralCelo = Number(formatEther(vault.creatorCollateral))
    const fanCollateralCelo = Number(formatEther(vault.fanCollateral))
    const supplyUtilization = vault.supplyCap > 0n
        ? (Number(vault.totalSupply) / Number(vault.supplyCap)) * 100
        : 0

    // Health color coding
    const getHealthColor = (health: number) => {
        if (health >= 150) return 'text-green-600 bg-green-50 border-green-200'
        if (health >= 120) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        return 'text-red-600 bg-red-50 border-red-200'
    }

    // Stage requirements and progress
    const stageRequirements = [0, 100, 500, 2500, 10000] // CELO requirements for each stage
    const currentStageReq = stageRequirements[vault.stage] || 0
    const nextStageReq = vault.stage < 4 ? stageRequirements[vault.stage + 1] : null

    // Collateral breakdown percentages
    const creatorPercentage = tvl > 0 ? (creatorCollateralCelo / tvl) * 100 : 0
    const fanPercentage = tvl > 0 ? (fanCollateralCelo / tvl) * 100 : 0

    return (
        <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Vault Management Overview</h2>

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

                {/* Current Stage */}
                <div className="p-4 rounded-lg border border-purple-200 bg-purple-50">
                    <div className="text-sm font-medium text-purple-600">Current Stage</div>
                    <div className="text-2xl font-bold text-purple-900">
                        {vault.stage}/4
                    </div>
                    <div className="text-xs text-purple-500 mt-1">
                        {vault.stage === 0 ? 'Not bootstrapped' : vault.stage === 4 ? 'Max stage' : 'Active'}
                    </div>
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
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                    <div className="text-sm font-medium text-blue-600">Aura Score</div>
                    <div className="text-2xl font-bold text-blue-900">
                        {vault.aura}
                    </div>
                    <div className="text-xs text-blue-500 mt-1">out of 200</div>
                </div>
            </div>

            {/* Collateral Breakdown */}
            <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Collateral Breakdown</h3>

                {/* Visual breakdown */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Collateral Distribution</span>
                        <span>{formatEther(vault.totalCollateral)} CELO Total</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden">
                        <div
                            className="bg-purple-600 h-full flex items-center justify-center text-xs text-white font-medium"
                            style={{ width: `${creatorPercentage}%` }}
                        >
                            {creatorPercentage > 15 ? 'Creator' : ''}
                        </div>
                        <div
                            className="bg-blue-600 h-full flex items-center justify-center text-xs text-white font-medium"
                            style={{ width: `${fanPercentage}%` }}
                        >
                            {fanPercentage > 15 ? 'Fans' : ''}
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Creator: {formatPercentage(creatorPercentage, 1)}</span>
                        <span>Fans: {formatPercentage(fanPercentage, 1)}</span>
                    </div>
                </div>

                {/* Detailed breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-purple-600 rounded"></div>
                            <h4 className="font-medium text-purple-900">Your Collateral</h4>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-purple-700">Amount:</span>
                                <span className="font-semibold text-purple-900">{formatNumber(creatorCollateralCelo, 2)} CELO</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-purple-700">Percentage:</span>
                                <span className="font-semibold text-purple-900">{formatPercentage(creatorPercentage, 1)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-purple-700">Stage Unlocked:</span>
                                <span className="font-semibold text-purple-900">Stage {vault.stage}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-blue-600 rounded"></div>
                            <h4 className="font-medium text-blue-900">Fan Collateral</h4>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-blue-700">Amount:</span>
                                <span className="font-semibold text-blue-900">{formatNumber(fanCollateralCelo, 2)} CELO</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-blue-700">Percentage:</span>
                                <span className="font-semibold text-blue-900">{formatPercentage(fanPercentage, 1)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-blue-700">Tokens Minted:</span>
                                <span className="font-semibold text-blue-900">{formatNumber(Number(formatEther(vault.totalSupply)), 2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Token Economics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Token Information */}
                <div>
                    <h3 className="text-lg font-medium mb-3">Token Economics</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Token Name:</span>
                            <span className="font-semibold">{vault.tokenName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Token Symbol:</span>
                            <span className="font-semibold">${vault.tokenSymbol}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Current Price:</span>
                            <span className="font-semibold">{pegInCelo.toFixed(4)} CELO</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Supply:</span>
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
                    </div>
                </div>

                {/* Stage Information */}
                <div>
                    <h3 className="text-lg font-medium mb-3">Stage Progress</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Current Stage:</span>
                            <span className="font-semibold">{vault.stage}/4</span>
                        </div>

                        {vault.stage > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Stage Requirement:</span>
                                <span className="font-semibold">{currentStageReq} CELO</span>
                            </div>
                        )}

                        {nextStageReq && vault.stage < 4 && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Next Stage Requirement:</span>
                                    <span className="font-semibold">{nextStageReq} CELO</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Progress:</span>
                                    <span className="font-semibold">
                                        {Math.min(100, (creatorCollateralCelo / nextStageReq) * 100).toFixed(0)}%
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-purple-600 h-2 rounded-full transition-all"
                                            style={{
                                                width: `${Math.min(100, (creatorCollateralCelo / nextStageReq) * 100)}%`
                                            }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {nextStageReq - creatorCollateralCelo > 0
                                            ? `${(nextStageReq - creatorCollateralCelo).toFixed(2)} CELO needed for Stage ${vault.stage + 1}`
                                            : `Ready to unlock Stage ${vault.stage + 1}!`
                                        }
                                    </div>
                                </div>
                            </>
                        )}

                        {vault.stage === 4 && (
                            <div className="text-center py-2">
                                <span className="text-sm font-semibold text-green-600">✓ Maximum Stage Reached</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}