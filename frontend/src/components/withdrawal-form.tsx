/**
 * @file Withdrawal form component
 * @description Form for treasury owner to withdraw funds
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther, isAddress } from 'viem'
import { TREASURY_ABI } from '@/lib/abis'
import { getContractAddress } from '@/lib/config'
import { WithdrawalFormData } from '@/types/treasury'
import { toast } from 'sonner'

const withdrawalSchema = z.object({
    to: z.string()
        .min(1, 'Recipient address is required')
        .refine((val) => isAddress(val), 'Invalid Ethereum address'),
    amount: z.string()
        .min(1, 'Amount is required')
        .refine((val) => {
            const num = parseFloat(val)
            return !isNaN(num) && num > 0
        }, 'Amount must be a positive number')
})

interface WithdrawalFormProps {
    currentBalance: bigint
    onSuccess?: () => void
}

export function WithdrawalForm({ currentBalance, onSuccess }: WithdrawalFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
        setValue
    } = useForm<WithdrawalFormData>({
        resolver: zodResolver(withdrawalSchema)
    })

    const { writeContract, data: hash, error: writeError } = useWriteContract()

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    const watchedAmount = watch('amount')

    // Handle form submission
    const onSubmit = async (data: WithdrawalFormData) => {
        try {
            setIsSubmitting(true)

            const amountWei = parseEther(data.amount)

            // Validate amount doesn't exceed balance
            if (amountWei > currentBalance) {
                toast.error('Amount exceeds current treasury balance')
                return
            }

            writeContract({
                address: getContractAddress('TREASURY'),
                abi: TREASURY_ABI,
                functionName: 'withdraw',
                args: [data.to as `0x${string}`, amountWei]
            })
        } catch (error) {
            console.error('Withdrawal error:', error)
            toast.error('Failed to submit withdrawal')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle transaction success
    if (isSuccess && !isSubmitting) {
        toast.success(`Successfully withdrew ${watchedAmount} CELO`)
        reset()
        onSuccess?.()
    }

    // Handle transaction error
    if (writeError) {
        toast.error(`Withdrawal failed: ${writeError.message}`)
    }

    const maxAmount = formatEther(currentBalance)
    const isValidAmount = watchedAmount && parseFloat(watchedAmount) <= parseFloat(maxAmount)

    return (
        <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Recipient Address */}
                <div>
                    <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                        Recipient Address
                    </label>
                    <input
                        {...register('to')}
                        type="text"
                        id="to"
                        placeholder="0x..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.to && (
                        <p className="text-red-500 text-sm mt-1">{errors.to.message}</p>
                    )}
                </div>

                {/* Amount */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                            Amount (CELO)
                        </label>
                        <button
                            type="button"
                            onClick={() => setValue('amount', maxAmount)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            Max: {parseFloat(maxAmount).toFixed(4)} CELO
                        </button>
                    </div>
                    <input
                        {...register('amount')}
                        type="number"
                        id="amount"
                        step="0.0001"
                        min="0"
                        max={maxAmount}
                        placeholder="0.0000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.amount && (
                        <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                    )}
                    {watchedAmount && !isValidAmount && (
                        <p className="text-red-500 text-sm mt-1">
                            Amount exceeds available balance
                        </p>
                    )}
                </div>

                {/* Current Balance Info */}
                <div className="bg-gray-50 rounded-md p-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Available Balance:</span>
                        <span className="font-medium">{parseFloat(maxAmount).toFixed(4)} CELO</span>
                    </div>
                    {watchedAmount && (
                        <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-600">Remaining After Withdrawal:</span>
                            <span className="font-medium">
                                {(parseFloat(maxAmount) - parseFloat(watchedAmount || '0')).toFixed(4)} CELO
                            </span>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || isConfirming || !isValidAmount || currentBalance === 0n}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitting || isConfirming ? (
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {isConfirming ? 'Confirming...' : 'Submitting...'}
                        </div>
                    ) : (
                        'Withdraw Funds'
                    )}
                </button>

                {currentBalance === 0n && (
                    <p className="text-gray-500 text-sm text-center">
                        No funds available for withdrawal
                    </p>
                )}
            </form>
        </div>
    )
}