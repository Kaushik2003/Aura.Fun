'use client'

import { VaultState } from '../../types/vault'
import { formatEther } from 'viem'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { VAULT_ABI } from '../../lib/abis'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface ForcedBurnAlertProps {
    vault: VaultState
    onExecuted: () => void
}

export function ForcedBurnAlert({ vault, onExecuted }: ForcedBurnAlertProps) {
    const [timeRemaining, setTimeRemaining] = useState<number>(0)
    const [isExpired, setIsExpired] = useState(false)

    const { writeContract, data: hash, isPending } = useWriteContract()
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash,
    })

    // Calculate time remaining
    useEffect(() => {
        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000)
            const deadline = Number(vault.forcedBurnDeadline)
            const remaining = deadline - now

            if (remaining <= 0) {
                setTimeRemaining(0)
                setIsExpired(true)
            } else {
                setTimeRemaining(remaining)
                setIsExpired(false)
            }
        }

        updateTimer()
        const interval = setInterval(updateTimer, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [vault.forcedBurnDeadline])

    // Format time remaining
    const formatTimeRemaining = (seconds: number) => {
        if (seconds <= 0) return 'Expired'

        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
    }

    // Handle forced burn check
    const handleCheckForcedBurn = async () => {
        try {
            writeContract({
                address: vault.address,
                abi: VAULT_ABI,
                functionName: 'checkAndTriggerForcedBurn',
            })
        } catch (error) {
            console.error('Failed to check forced burn:', error)
            toast.error('Failed to check forced burn')
        }
    }

    // Handle transaction success
    useEffect(() => {
        if (hash && !isConfirming && !isPending) {
            toast.success('Forced burn check completed')
            onExecuted()
        }
    }, [hash, isConfirming, isPending, onExecuted])

    const newSupplyCap = vault.supplyCap - vault.pendingForcedBurn

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>

                <div className="ml-3 flex-1">
                    <h3 className="text-lg font-medium text-red-800">
                        ⚠️ Forced Burn Triggered
                    </h3>

                    <div className="mt-2 text-sm text-red-700">
                        <p className="mb-3">
                            The vault's supply exceeds its capacity due to an aura decrease.
                            A forced burn has been triggered to restore balance.
                        </p>

                        {/* Burn Details */}
                        <div className="bg-white rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div className="font-medium text-gray-900">Tokens to Burn</div>
                                    <div className="text-red-600 font-semibold">
                                        {formatEther(vault.pendingForcedBurn)} tokens
                                    </div>
                                </div>

                                <div>
                                    <div className="font-medium text-gray-900">New Supply Cap</div>
                                    <div className="text-gray-600">
                                        {formatEther(newSupplyCap)} tokens
                                    </div>
                                </div>

                                <div>
                                    <div className="font-medium text-gray-900">Grace Period</div>
                                    <div className={isExpired ? 'text-red-600 font-semibold' : 'text-yellow-600'}>
                                        {isExpired ? 'EXPIRED' : formatTimeRemaining(timeRemaining)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Message */}
                        <div className="mb-4">
                            {isExpired ? (
                                <div className="flex items-center text-red-700">
                                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <strong>Grace period has expired.</strong> The forced burn can now be executed.
                                </div>
                            ) : (
                                <div className="flex items-center text-yellow-700">
                                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    <strong>Grace period active.</strong> Users have time to redeem before forced burn.
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleCheckForcedBurn}
                                disabled={isPending || isConfirming}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {isPending || isConfirming ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {isPending ? 'Confirming...' : 'Processing...'}
                                    </>
                                ) : (
                                    'Check Forced Burn'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}