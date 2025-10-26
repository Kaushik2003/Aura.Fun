'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { VaultState } from '../../types/vault'
import { VAULT_ABI } from '../../lib/abis'
import { toast } from 'sonner'

interface StageUnlockFormProps {
    vault: VaultState
    onSuccess: () => void
}

// Stage configuration constants (from Deploy.s.sol)
const STAGE_REQUIREMENTS = {
    1: { stake: 100, capacity: 500 },
    2: { stake: 300, capacity: 2500 },
    3: { stake: 800, capacity: 9500 },
    4: { stake: 1800, capacity: 34500 }
} as const

export function StageUnlockForm({ vault, onSuccess }: StageUnlockFormProps) {
    const [amount, setAmount] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { writeContract, data: hash, error, isPending } = useWriteContract()

    const { isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash,
    })

    // Calculate next stage info
    const currentStage = vault.stage
    const nextStage = currentStage < 4 ? currentStage + 1 : null
    const nextStageConfig = nextStage ? STAGE_REQUIREMENTS[nextStage as keyof typeof STAGE_REQUIREMENTS] : null

    // Current creator collateral in CELO
    const currentCollateralCelo = Number(formatEther(vault.creatorCollateral))

    // Required stake for next stage
    const requiredStake = nextStageConfig?.stake || 0

    // Remaining amount needed
    const remainingAmount = Math.max(0, requiredStake - currentCollateralCelo)

    // Pre-fill with remaining amount needed
    useEffect(() => {
        if (remainingAmount > 0) {
            setAmount(remainingAmount.toString())
        }
    }, [remainingAmount])

    // Handle transaction success/error
    useEffect(() => {
        if (isConfirming === false && hash) {
            toast.success(`Stage ${nextStage} unlocked! Your vault capacity has increased.`)
            setIsSubmitting(false)
            onSuccess()
        }
    }, [isConfirming, hash, onSuccess, nextStage])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!nextStage || !nextStageConfig) {
            toast.error('Maximum stage already reached')
            return
        }

        const amountNum = parseFloat(amount)
        if (amountNum <= 0) {
            toast.error('Amount must be greater than 0')
            return
        }

        // Validate that current collateral + entered amount >= next stage requirement
        const totalAfterDeposit = currentCollateralCelo + amountNum
        if (totalAfterDeposit < requiredStake) {
            toast.error(`Insufficient amount to unlock Stage ${nextStage}. Need ${requiredStake} CELO total.`)
            return
        }

        setIsSubmitting(true)

        try {
            writeContract({
                address: vault.address,
                abi: VAULT_ABI,
                functionName: 'unlockStage',
                value: parseEther(amount),
            })
        } catch (error) {
            console.error('Stage unlock failed:', error)
            toast.error('Failed to unlock stage. Please try again.')
            setIsSubmitting(false)
        }
    }

    const isLoading = isPending || isConfirming || isSubmitting

    // Don't render if already at max stage
    if (currentStage >= 4) {
        return (
            <div className="bg-white border rounded-lg p-6">
                <div className="text-center">
                    <div className="mb-4">
                        <svg className="w-12 h-12 text-purple-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">Maximum Stage Reached</h3>
                    <p className="text-sm text-gray-600">
                        Your vault has reached Stage 4, the maximum stage available.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white border rounded-lg p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-purple-900">Unlock Next Stage</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Deposit additional CELO to unlock Stage {nextStage} and increase mint capacity
                </p>
            </div>

            {/* Current Stage Progress */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-purple-900 mb-3">Stage Progression</h4>

                {/* Current Stage Info */}
                <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                        <span className="text-purple-700">Current Stage:</span>
                        <span className="font-semibold text-purple-900">{currentStage}/4</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-purple-700">Your Collateral:</span>
                        <span className="font-semibold text-purple-900">{currentCollateralCelo.toFixed(2)} CELO</span>
                    </div>
                </div>

                {/* Next Stage Requirements */}
                {nextStageConfig && (
                    <>
                        <div className="border-t border-purple-200 pt-3 mb-3">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-purple-700">Stage {nextStage} Requirements:</span>
                                <span className="font-semibold text-purple-900">{requiredStake} CELO</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-purple-700">New Capacity:</span>
                                <span className="font-semibold text-purple-900">{nextStageConfig.capacity.toLocaleString()} tokens</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-purple-700">Remaining Needed:</span>
                                <span className="font-semibold text-purple-900">{remainingAmount.toFixed(2)} CELO</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                            <div className="flex justify-between text-xs text-purple-600 mb-1">
                                <span>Progress to Stage {nextStage}</span>
                                <span>{Math.min(100, (currentCollateralCelo / requiredStake) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-purple-200 rounded-full h-3">
                                <div
                                    className="bg-purple-600 h-3 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (currentCollateralCelo / requiredStake) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                        CELO Amount to Deposit
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="0.01"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="0.00"
                            disabled={isLoading}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">CELO</span>
                        </div>
                    </div>
                    {parseFloat(amount) > 0 && nextStageConfig && (
                        <div className="mt-2 text-sm">
                            <p className="text-gray-600">
                                Total after deposit: {(currentCollateralCelo + parseFloat(amount)).toFixed(2)} CELO
                            </p>
                            {(currentCollateralCelo + parseFloat(amount)) < requiredStake && (
                                <p className="text-red-600">
                                    Still need {(requiredStake - currentCollateralCelo - parseFloat(amount)).toFixed(2)} more CELO for Stage {nextStage}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setAmount(remainingAmount.toString())}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        disabled={isLoading || remainingAmount <= 0}
                    >
                        Exact Amount ({remainingAmount.toFixed(2)} CELO)
                    </button>
                    <button
                        type="button"
                        onClick={() => setAmount((remainingAmount + 50).toString())}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        +50 CELO
                    </button>
                    <button
                        type="button"
                        onClick={() => setAmount((remainingAmount + 100).toString())}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        +0.01 CELO
                    </button>
                </div>

                {/* Transaction Status */}
                {hash && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            {isConfirming ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="text-sm text-blue-700">Confirming transaction...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm text-blue-700">Transaction submitted</span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L10 8.586l1.293-1.293a1 1 0 111.414 1.414L11.414 10l1.293 1.293a1 1 0 01-1.414 1.414L10 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L8.586 10 7.293 8.707a1 1 0 011.414-1.414L10 8.586l1.293-1.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-red-700">
                                {error.message?.includes('InsufficientCollateral')
                                    ? 'Insufficient amount to unlock next stage'
                                    : error.message?.includes('StageNotUnlocked')
                                        ? 'Vault must be bootstrapped first'
                                        : error.message?.includes('Unauthorized')
                                            ? 'Only the creator can unlock stages'
                                            : 'Transaction failed. Please try again.'
                                }
                            </span>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || parseFloat(amount) <= 0 || !nextStageConfig}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Unlocking Stage...'}
                        </div>
                    ) : (
                        `Unlock Stage ${nextStage} with ${amount} CELO`
                    )}
                </button>
            </form>

            {/* Info Box */}
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-gray-600">
                        <p className="font-medium mb-1">What happens when you unlock Stage {nextStage}:</p>
                        <ul className="space-y-1 text-xs">
                            <li>• Mint capacity increases to {nextStageConfig?.capacity.toLocaleString()} tokens</li>
                            <li>• Fans can mint more tokens in your vault</li>
                            <li>• Your collateral helps maintain vault health</li>
                            <li>• Higher stages unlock greater earning potential</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}