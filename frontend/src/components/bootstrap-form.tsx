'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { VaultState } from '../../types/vault'
import { VAULT_ABI } from '../../lib/abis'
import { toast } from 'sonner'

interface BootstrapFormProps {
    vault: VaultState
    onSuccess: () => void
}

export function BootstrapForm({ vault, onSuccess }: BootstrapFormProps) {
    const [amount, setAmount] = useState('0.001') // Pre-fill with minimum requirement
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { writeContract, data: hash, error, isPending } = useWriteContract()

    const { isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash,
    })

    // Handle transaction success/error
    useEffect(() => {
        if (isConfirming === false && hash) {
            toast.success('Stage 1 unlocked! Your vault is now active.')
            setIsSubmitting(false)
            onSuccess()
        }
    }, [isConfirming, hash, onSuccess])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const amountNum = parseFloat(amount)
        if (amountNum < 0.001) {
            toast.error('Minimum 0.001 CELO required to unlock Stage 1')
            return
        }

        setIsSubmitting(true)

        try {
            writeContract({
                address: vault.address,
                abi: VAULT_ABI,
                functionName: 'bootstrapCreatorStake',
                value: parseEther(amount),
            })
        } catch (error) {
            console.error('Bootstrap failed:', error)
            toast.error('Failed to bootstrap vault. Please try again.')
            setIsSubmitting(false)
        }
    }

    const isLoading = isPending || isConfirming || isSubmitting

    return (
        <div className="bg-white border rounded-lg p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-purple-900">Bootstrap Vault</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Deposit CELO to unlock Stage 1 and enable fan minting
                </p>
            </div>

            {/* Stage 1 Requirements */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-purple-900 mb-2">Stage 1 Requirements</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-purple-700">Minimum Deposit:</span>
                        <span className="font-semibold text-purple-900">0.001 CELO</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-purple-700">Unlocks:</span>
                        <span className="font-semibold text-purple-900">Fan minting</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-purple-700">Mint Capacity:</span>
                        <span className="font-semibold text-purple-900">50 tokens</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                        CELO Amount
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="0.001"
                            step="0.001"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="0.001"
                            disabled={isLoading}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">CELO</span>
                        </div>
                    </div>
                    {parseFloat(amount) < 0.001 && amount && (
                        <p className="text-red-600 text-sm mt-1">
                            Minimum 0.001 CELO required
                        </p>
                    )}
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setAmount('0.001')}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        0.001 CELO
                    </button>
                    <button
                        type="button"
                        onClick={() => setAmount('0.01')}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        0.01 CELO
                    </button>
                    <button
                        type="button"
                        onClick={() => setAmount('0.1')}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        0.1 CELO
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
                                    ? 'Insufficient CELO balance'
                                    : 'Transaction failed. Please try again.'
                                }
                            </span>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || parseFloat(amount) < 0.001}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Bootstrapping...'}
                        </div>
                    ) : (
                        `Bootstrap with ${amount} CELO`
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
                        <p className="font-medium mb-1">What happens after bootstrap:</p>
                        <ul className="space-y-1 text-xs">
                            <li>• Your vault becomes active (Stage 1)</li>
                            <li>• Fans can start minting your tokens</li>
                            <li>• You can unlock higher stages for more capacity</li>
                            <li>• Your collateral helps maintain vault health</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}