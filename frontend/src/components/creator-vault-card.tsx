'use client'

import Link from 'next/link'
import { formatEther } from 'viem'
import { VaultState } from '../../types/vault'

interface CreatorVaultCardProps {
    vault: VaultState
}

export function CreatorVaultCard({ vault }: CreatorVaultCardProps) {
    const healthColor =
        Number(vault.health) >= 1.5e18 ? 'text-green-600' :
            Number(vault.health) >= 1.2e18 ? 'text-yellow-600' :
                'text-red-600'

    const healthPercentage = (Number(vault.health) / 1e18 * 100).toFixed(0)

    // Stage requirements in CELO
    const stageRequirements = [0, 100, 500, 2500, 10000]
    const nextStage = vault.stage < 4 ? vault.stage + 1 : null
    const nextStageRequired = nextStage ? stageRequirements[nextStage] : null
    const currentCollateralCelo = Number(formatEther(vault.creatorCollateral))

    const getStageStatus = () => {
        if (vault.stage === 0) {
            return { text: 'Not Bootstrapped', color: 'text-red-600' }
        } else if (vault.stage === 4) {
            return { text: 'Max Stage', color: 'text-green-600' }
        } else {
            return { text: `Stage ${vault.stage}/4`, color: 'text-blue-600' }
        }
    }

    const stageStatus = getStageStatus()

    return (
        <Link href={`/creator/vaults/${vault.address}`}>
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer bg-white">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold">{vault.tokenName}</h3>
                        <p className="text-sm text-gray-600">${vault.tokenSymbol}</p>
                    </div>
                    <div className="text-right">
                        <p className={`text-sm font-medium ${stageStatus.color}`}>{stageStatus.text}</p>
                        <p className={`text-lg font-bold ${healthColor}`}>
                            {healthPercentage}%
                        </p>
                    </div>
                </div>

                <div className="space-y-3 text-sm mb-4">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Aura Score:</span>
                        <span className="font-semibold">{vault.aura}/200</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Your Collateral:</span>
                        <span className="font-semibold">{parseFloat(formatEther(vault.creatorCollateral)).toFixed(2)} CELO</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Fan Collateral:</span>
                        <span className="font-semibold">{parseFloat(formatEther(vault.fanCollateral)).toFixed(2)} CELO</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Total Supply:</span>
                        <span className="font-semibold">{parseFloat(formatEther(vault.totalSupply)).toFixed(2)} tokens</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Token Price:</span>
                        <span className="font-semibold">{parseFloat(formatEther(vault.peg)).toFixed(4)} CELO</span>
                    </div>
                </div>

                {/* Stage progression or status */}
                {vault.stage === 0 ? (
                    <div className="border-t pt-3">
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                            <p className="text-sm text-yellow-800 font-medium">⚠️ Bootstrap Required</p>
                            <p className="text-xs text-yellow-700 mt-1">Deposit 100 CELO to activate vault</p>
                        </div>
                    </div>
                ) : vault.stage === 4 ? (
                    <div className="border-t pt-3 text-center">
                        <span className="text-sm font-semibold text-green-600">✓ Maximum Stage Reached</span>
                    </div>
                ) : nextStage && nextStageRequired ? (
                    <div className="border-t pt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                            <span>Next Stage: {nextStageRequired} CELO</span>
                            <span>{((currentCollateralCelo / nextStageRequired) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-purple-600 h-2 rounded-full transition-all"
                                style={{
                                    width: `${Math.min((currentCollateralCelo / nextStageRequired) * 100, 100)}%`
                                }}
                            />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                            {nextStageRequired - currentCollateralCelo > 0
                                ? `${(nextStageRequired - currentCollateralCelo).toFixed(2)} CELO needed`
                                : 'Ready to unlock!'
                            }
                        </p>
                    </div>
                ) : null}

                {/* Alerts */}
                {vault.pendingForcedBurn > 0n && (
                    <div className="border-t pt-3">
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-sm text-red-800 font-medium">🔥 Forced Burn Active</p>
                            <p className="text-xs text-red-700 mt-1">
                                {parseFloat(formatEther(vault.pendingForcedBurn)).toFixed(2)} tokens pending burn
                            </p>
                        </div>
                    </div>
                )}

                {Number(vault.health) < 1.2e18 && (
                    <div className="border-t pt-3">
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-sm text-red-800 font-medium">⚠️ Liquidation Risk</p>
                            <p className="text-xs text-red-700 mt-1">Health below 120% - add collateral</p>
                        </div>
                    </div>
                )}
            </div>
        </Link>
    )
}