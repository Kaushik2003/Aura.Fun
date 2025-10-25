'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatEther, parseEther, Address } from 'viem'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi'
import { VaultState, Position } from '../../types/vault'
import { VAULT_ABI, TOKEN_ABI } from '../../lib/abis'
import { useUserPositions } from '../../hooks/use-user-positions'
import { calculateHealth } from '../../lib/calculations'
import { showTransactionPending, showTransactionSuccess, showTransactionError, showRedeemSuccess } from '../../lib/toast-config'

// Form validation schema
const redeemFormSchema = z.object({
    quantity: z.string()
        .min(1, 'Quantity is required')
        .refine((val) => {
            const num = parseFloat(val)
            return !isNaN(num) && num > 0
        }, 'Quantity must be a positive number')
})

type RedeemFormData = z.infer<typeof redeemFormSchema>

interface RedeemFormProps {
    vault: VaultState
    userAddress?: Address
    onSuccess: () => void
}

/**
 * Calculate FIFO redemption return based on user positions
 */
function calculateFifoReturn(positions: Position[], redeemQuantity: bigint): {
    estimatedReturn: bigint
    affectedPositions: Position[]
} {
    let remainingToRedeem = redeemQuantity
    let totalReturn = 0n
    const affectedPositions: Position[] = []

    // Process positions in FIFO order (oldest first)
    for (const position of positions) {
        if (remainingToRedeem <= 0n) break

        const redeemFromPosition = remainingToRedeem >= position.qty ? position.qty : remainingToRedeem
        const returnFromPosition = (position.collateral * redeemFromPosition) / position.qty

        totalReturn += returnFromPosition
        affectedPositions.push({
            ...position,
            qty: redeemFromPosition, // Amount being redeemed from this position
        })

        remainingToRedeem -= redeemFromPosition
    }

    return {
        estimatedReturn: totalReturn,
        affectedPositions,
    }
}

export function RedeemForm({ vault, userAddress, onSuccess }: RedeemFormProps) {
    const { address } = useAccount()
    const [toastId, setToastId] = useState<string | number | null>(null)
    const [needsApproval, setNeedsApproval] = useState(false)
    const [isApproving, setIsApproving] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
    } = useForm<RedeemFormData>({
        resolver: zodResolver(redeemFormSchema),
        defaultValues: {
            quantity: '',
        },
    })

    // Get user positions for FIFO calculation
    const { positions } = useUserPositions(vault.address, userAddress)

    // Get user's token balance
    const { data: tokenBalance } = useReadContract({
        address: vault.token,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress] : undefined,
    })

    // Get current allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: vault.token,
        abi: TOKEN_ABI,
        functionName: 'allowance',
        args: userAddress ? [userAddress, vault.address] : undefined,
    })

    const { writeContract, data: hash, isPending, error } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    const quantityValue = watch('quantity')

    // Calculate redemption details and validation
    const redemptionCalculation = (() => {
        if (!quantityValue || quantityValue === '' || !userAddress || !positions) {
            return {
                quantity: 0n,
                estimatedReturn: 0n,
                affectedPositions: [],
                healthAfter: 0,
                isValid: true,
                errorMessage: undefined,
            }
        }

        try {
            const quantity = parseEther(quantityValue)

            // Check if user has sufficient balance
            if (tokenBalance && quantity > tokenBalance) {
                return {
                    quantity,
                    estimatedReturn: 0n,
                    affectedPositions: [],
                    healthAfter: 0,
                    isValid: false,
                    errorMessage: 'Insufficient token balance for this redemption.',
                }
            }

            // Calculate FIFO return
            const { estimatedReturn, affectedPositions } = calculateFifoReturn(positions, quantity)

            // Calculate health after redemption
            const newTotalSupply = vault.totalSupply - quantity
            const newTotalCollateral = vault.totalCollateral - estimatedReturn
            const healthAfter = calculateHealth(newTotalCollateral, newTotalSupply, vault.peg)

            // Check if health would drop below 150%
            if (healthAfter < 150) {
                return {
                    quantity,
                    estimatedReturn,
                    affectedPositions,
                    healthAfter,
                    isValid: false,
                    errorMessage: 'This redemption would drop vault health below 150%. Reduce quantity.',
                }
            }

            return {
                quantity,
                estimatedReturn,
                affectedPositions,
                healthAfter,
                isValid: true,
                errorMessage: undefined,
            }
        } catch (error) {
            return {
                quantity: 0n,
                estimatedReturn: 0n,
                affectedPositions: [],
                healthAfter: 0,
                isValid: false,
                errorMessage: 'Invalid quantity format.',
            }
        }
    })()

    // Check if approval is needed
    useEffect(() => {
        if (allowance !== undefined && redemptionCalculation.quantity > 0n) {
            setNeedsApproval(allowance < redemptionCalculation.quantity)
        }
    }, [allowance, redemptionCalculation.quantity])

    // Handle approval
    const handleApprove = async () => {
        if (!userAddress) return

        try {
            setIsApproving(true)
            const id = showTransactionPending('Approve')
            setToastId(id)

            writeContract({
                address: vault.token,
                abi: TOKEN_ABI,
                functionName: 'approve',
                args: [vault.address, redemptionCalculation.quantity],
            })
        } catch (error) {
            console.error('Failed to submit approval transaction:', error)
            showTransactionError('Approve', error)
            setIsApproving(false)
        }
    }

    // Handle redemption
    const onSubmit = async (data: RedeemFormData) => {
        if (!redemptionCalculation.isValid || !userAddress) return

        // Check if approval is needed first
        if (needsApproval) {
            await handleApprove()
            return
        }

        try {
            const id = showTransactionPending('Redeem')
            setToastId(id)

            writeContract({
                address: vault.address,
                abi: VAULT_ABI,
                functionName: 'redeemTokens',
                args: [redemptionCalculation.quantity],
            })
        } catch (error) {
            console.error('Failed to submit redeem transaction:', error)
            showTransactionError('Redeem', error)
        }
    }

    // Handle transaction success
    useEffect(() => {
        if (isSuccess && hash) {
            if (toastId) {
                if (isApproving) {
                    showTransactionSuccess('Approve', hash)
                    setIsApproving(false)
                    setNeedsApproval(false)
                    refetchAllowance()
                } else {
                    showRedeemSuccess(
                        formatEther(redemptionCalculation.quantity),
                        vault.tokenSymbol,
                        formatEther(redemptionCalculation.estimatedReturn)
                    )
                    reset()
                    onSuccess()
                }
                setToastId(null)
            }
        }
    }, [isSuccess, hash, toastId, isApproving, redemptionCalculation, vault.tokenSymbol, reset, onSuccess, refetchAllowance])

    // Handle transaction error
    useEffect(() => {
        if (error) {
            if (toastId) {
                showTransactionError(isApproving ? 'Approve' : 'Redeem', error)
                setToastId(null)
            }
            setIsApproving(false)
        }
    }, [error, toastId, isApproving])

    const isLoading = isPending || isConfirming

    // Don't show form if user has no tokens
    if (tokenBalance === 0n) {
        return (
            <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Redeem Tokens</h3>
                <div className="text-center text-gray-600 py-8">
                    <p>You don't have any {vault.tokenSymbol} tokens to redeem.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Redeem Tokens</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Quantity Input */}
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        Token Quantity
                    </label>
                    <input
                        {...register('quantity')}
                        type="number"
                        step="0.000000000000000001"
                        min="0"
                        max={tokenBalance ? formatEther(tokenBalance) : undefined}
                        placeholder="0.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.quantity && (
                        <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
                    )}
                </div>

                {/* Return Breakdown */}
                {quantityValue && quantityValue !== '' && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <h4 className="font-medium text-gray-900">Redemption Details</h4>

                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tokens to Redeem:</span>
                                <span className="font-medium">
                                    {formatEther(redemptionCalculation.quantity)} {vault.tokenSymbol}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Estimated Return:</span>
                                <span className="font-medium">
                                    {formatEther(redemptionCalculation.estimatedReturn)} CELO
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Health After:</span>
                                <span className={`font-medium ${redemptionCalculation.healthAfter >= 150 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {redemptionCalculation.healthAfter.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        {/* FIFO Information */}
                        {redemptionCalculation.affectedPositions.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-gray-500 mb-2">
                                    Positions affected (FIFO order):
                                </p>
                                <div className="space-y-1">
                                    {redemptionCalculation.affectedPositions.slice(0, 3).map((position, index) => (
                                        <div key={index} className="flex justify-between text-xs text-gray-600">
                                            <span>Position #{position.index + 1}</span>
                                            <span>{formatEther(position.qty)} tokens</span>
                                        </div>
                                    ))}
                                    {redemptionCalculation.affectedPositions.length > 3 && (
                                        <div className="text-xs text-gray-500">
                                            +{redemptionCalculation.affectedPositions.length - 3} more positions
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Validation Error */}
                {!redemptionCalculation.isValid && redemptionCalculation.errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-700 text-sm">{redemptionCalculation.errorMessage}</p>
                    </div>
                )}

                {/* FIFO Explanation */}
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <p className="text-blue-700 font-medium mb-1">FIFO Redemption</p>
                    <p className="text-blue-600 text-xs">
                        Tokens are redeemed from your oldest positions first.
                        The estimated return is calculated based on the collateral from those positions.
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!address || !redemptionCalculation.isValid || isLoading || !tokenBalance || tokenBalance === 0n}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isPending ? 'Confirming...' : 'Processing...'}
                        </>
                    ) : needsApproval ? (
                        'Approve Tokens'
                    ) : !address ? (
                        'Connect Wallet'
                    ) : (
                        'Redeem Tokens'
                    )}
                </button>

                {/* User Balance Display */}
                {address && tokenBalance && (
                    <div className="text-center text-sm text-gray-600">
                        Your balance: {parseFloat(formatEther(tokenBalance)).toFixed(4)} {vault.tokenSymbol}
                    </div>
                )}

                {/* Approval Status */}
                {needsApproval && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-700 text-sm">
                            You need to approve the vault to spend your tokens before redeeming.
                        </p>
                    </div>
                )}
            </form>
        </div>
    )
}