'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatEther, parseEther } from 'viem'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useBalance } from 'wagmi'
import { VaultState } from '../../types/vault'
import { VAULT_ABI } from '../../lib/abis'
import { calculateRequiredCollateral, calculateMintFee } from '../../lib/calculations'
import { showTransactionPending, showTransactionSuccess, showTransactionError } from '../../lib/toast-config'

// Form validation schema
const mintFormSchema = z.object({
    quantity: z.string()
        .min(1, 'Quantity is required')
        .refine((val) => {
            const num = parseFloat(val)
            return !isNaN(num) && num > 0
        }, 'Quantity must be a positive number')
})

type MintFormData = z.infer<typeof mintFormSchema>

interface MintFormProps {
    vault: VaultState
    onSuccess: () => void
}

// Stage mint caps (cumulative)
const STAGE_MINT_CAPS = [
    0n, // Stage 0: No minting allowed
    parseEther('50'), // Stage 1: 50 tokens
    parseEther('250'), // Stage 2: 250 tokens  
    parseEther('950'), // Stage 3: 950 tokens
    parseEther('3450'), // Stage 4: 3,450 tokens
]

export function MintForm({ vault, onSuccess }: MintFormProps) {
    const { address } = useAccount()
    const { data: celoBalance } = useBalance({ address })
    const [toastId, setToastId] = useState<string | number | null>(null)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
    } = useForm<MintFormData>({
        resolver: zodResolver(mintFormSchema),
        defaultValues: {
            quantity: '',
        },
    })

    const { writeContract, data: hash, isPending, error } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    const quantityValue = watch('quantity')

    // Calculate mint costs and validation
    const mintCalculation = (() => {
        if (!quantityValue || quantityValue === '') {
            return {
                quantity: 0n,
                requiredCollateral: 0n,
                mintFee: 0n,
                totalCost: 0n,
                isValid: true,
                errorMessage: undefined,
            }
        }

        try {
            const quantity = parseEther(quantityValue)

            // Validation checks
            if (vault.stage === 0) {
                return {
                    quantity,
                    requiredCollateral: 0n,
                    mintFee: 0n,
                    totalCost: 0n,
                    isValid: false,
                    errorMessage: 'Vault not bootstrapped. Creator must deposit 0.001 CELO first.',
                }
            }

            // Check stage capacity
            const stageCap = STAGE_MINT_CAPS[vault.stage]
            if (vault.totalSupply + quantity > stageCap) {
                return {
                    quantity,
                    requiredCollateral: 0n,
                    mintFee: 0n,
                    totalCost: 0n,
                    isValid: false,
                    errorMessage: 'Stage capacity reached. Wait for creator to unlock next stage.',
                }
            }

            // Check supply cap
            if (vault.totalSupply + quantity > vault.supplyCap) {
                return {
                    quantity,
                    requiredCollateral: 0n,
                    mintFee: 0n,
                    totalCost: 0n,
                    isValid: false,
                    errorMessage: 'Supply cap reached due to low aura. Wait for aura to increase.',
                }
            }

            const requiredCollateral = calculateRequiredCollateral(quantity, vault.peg)
            const mintFee = calculateMintFee(requiredCollateral)
            const totalCost = requiredCollateral + mintFee

            // Check user balance
            if (celoBalance && totalCost > celoBalance.value) {
                return {
                    quantity,
                    requiredCollateral,
                    mintFee,
                    totalCost,
                    isValid: false,
                    errorMessage: 'Insufficient CELO balance for this mint.',
                }
            }

            return {
                quantity,
                requiredCollateral,
                mintFee,
                totalCost,
                isValid: true,
                errorMessage: undefined,
            }
        } catch (error) {
            return {
                quantity: 0n,
                requiredCollateral: 0n,
                mintFee: 0n,
                totalCost: 0n,
                isValid: false,
                errorMessage: 'Invalid quantity format.',
            }
        }
    })()

    // Handle form submission
    const onSubmit = async (data: MintFormData) => {
        if (!mintCalculation.isValid || !address) return

        try {
            const id = showTransactionPending('Mint')
            setToastId(id)

            writeContract({
                address: vault.address,
                abi: VAULT_ABI,
                functionName: 'mintTokens',
                args: [mintCalculation.quantity],
                value: mintCalculation.totalCost,
            })
        } catch (error) {
            console.error('Failed to submit mint transaction:', error)
            showTransactionError('Mint', error)
        }
    }

    // Handle transaction success
    useEffect(() => {
        if (isSuccess && hash) {
            if (toastId) {
                showTransactionSuccess('Mint', hash)
                setToastId(null)
            }
            reset()
            onSuccess()
        }
    }, [isSuccess, hash, toastId, reset, onSuccess])

    // Handle transaction error
    useEffect(() => {
        if (error) {
            if (toastId) {
                showTransactionError('Mint', error)
                setToastId(null)
            }
        }
    }, [error, toastId])

    const isLoading = isPending || isConfirming

    return (
        <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Mint Tokens</h3>

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
                        placeholder="0.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.quantity && (
                        <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
                    )}
                </div>

                {/* Cost Breakdown */}
                {quantityValue && quantityValue !== '' && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <h4 className="font-medium text-gray-900">Cost Breakdown</h4>

                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Required Collateral:</span>
                                <span className="font-medium">
                                    {formatEther(mintCalculation.requiredCollateral)} CELO
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Mint Fee (0.5%):</span>
                                <span className="font-medium">
                                    {formatEther(mintCalculation.mintFee)} CELO
                                </span>
                            </div>

                            <div className="border-t pt-1 mt-2">
                                <div className="flex justify-between font-semibold">
                                    <span>Total Cost:</span>
                                    <span>{formatEther(mintCalculation.totalCost)} CELO</span>
                                </div>
                            </div>
                        </div>

                        {/* Current peg display */}
                        <div className="text-xs text-gray-500 mt-2">
                            Current price: {formatEther(vault.peg)} CELO per token
                        </div>
                    </div>
                )}

                {/* Validation Error */}
                {!mintCalculation.isValid && mintCalculation.errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-700 text-sm">{mintCalculation.errorMessage}</p>
                    </div>
                )}

                {/* Capacity Information */}
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-blue-700 font-medium">Stage {vault.stage} Capacity</span>
                        <span className="text-blue-600">
                            {formatEther(vault.totalSupply)} / {formatEther(STAGE_MINT_CAPS[vault.stage])} tokens
                        </span>
                    </div>

                    <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                                width: `${Math.min(
                                    (Number(vault.totalSupply) / Number(STAGE_MINT_CAPS[vault.stage])) * 100,
                                    100
                                )}%`,
                            }}
                        />
                    </div>

                    <div className="flex justify-between items-center mt-2 text-xs text-blue-600">
                        <span>Available: {formatEther(STAGE_MINT_CAPS[vault.stage] - vault.totalSupply)} tokens</span>
                        <span>Supply Cap: {formatEther(vault.supplyCap)} tokens</span>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!address || !mintCalculation.isValid || isLoading || vault.stage === 0}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isPending ? 'Confirming...' : 'Processing...'}
                        </>
                    ) : vault.stage === 0 ? (
                        'Vault Not Bootstrapped'
                    ) : !address ? (
                        'Connect Wallet'
                    ) : (
                        'Mint Tokens'
                    )}
                </button>

                {/* User Balance Display */}
                {address && celoBalance && (
                    <div className="text-center text-sm text-gray-600">
                        Your balance: {parseFloat(formatEther(celoBalance.value)).toFixed(4)} CELO
                    </div>
                )}
            </form>
        </div>
    )
}