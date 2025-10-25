'use client'

import { useState } from 'react'
import { formatEther, parseEther } from 'viem'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { VaultState, LiquidationCalculation } from '../../types/vault'
import { VAULT_ABI } from '../../lib/abis'
import { formatAddress, formatNumber, cn } from '../../lib/utils'
import { showTransactionError, showLiquidationSuccess } from '../../lib/toast-config'
import { calculateLiquidation } from '../../lib/calculations'

interface LiquidationCardProps {
    vault: VaultState
}

export function LiquidationCard({ vault }: LiquidationCardProps) {
    const { address: userAddress } = useAccount()
    const [paymentAmount, setPaymentAmount] = useState('')

    const [calculation, setCalculation] = useState<LiquidationCalculation | null>(null)

    const { writeContract, data: hash, isPending } = useWriteContract()
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

    // Calculate display values
    const healthPercentage = Number(vault.health) / 1e16
    const tvlInCelo = Number(formatEther(vault.totalCollateral))
    const pegInCelo = Number(formatEther(vault.peg))
    const totalSupplyInTokens = Number(formatEther(vault.totalSupply))

    // Calculate liquidation requirements
    const calculateLiquidationDetails = (paymentAmountWei: bigint): LiquidationCalculation => {
        const liquidationResult = calculateLiquidation(
            vault.totalCollateral,
            vault.totalSupply,
            vault.peg,
            paymentAmountWei
        )

        // Calculate creator penalty (10% of creator collateral, capped at 20% of payment)
        const creatorPenaltyUncapped = vault.creatorCollateral / 10n
        const creatorPenaltyCap = paymentAmountWei / 5n // 20% of payment
        const creatorPenalty = creatorPenaltyUncapped < creatorPenaltyCap ? creatorPenaltyUncapped : creatorPenaltyCap

        // Validation
        const isValid = paymentAmountWei >= parseEther('0.01') && liquidationResult.healthAfter >= 150

        return {
            paymentAmount: paymentAmountWei,
            tokensToRemove: liquidationResult.tokensToRemove,
            bounty: liquidationResult.bounty,
            creatorPenalty,
            healthAfter: BigInt(Math.floor(liquidationResult.healthAfter * 1e16)), // Convert percentage to wei format
            isValid
        }
    }

    // Handle payment amount change
    const handlePaymentChange = (value: string) => {
        setPaymentAmount(value)

        if (!value || isNaN(Number(value))) {
            setCalculation(null)
            return
        }

        try {
            const paymentWei = parseEther(value)
            const calc = calculateLiquidationDetails(paymentWei)
            setCalculation(calc)
        } catch (error) {
            setCalculation(null)
        }
    }

    // Handle liquidation submission
    const handleLiquidate = async () => {
        if (!calculation || !calculation.isValid || !userAddress) {
            return
        }

        try {
            writeContract({
                address: vault.address,
                abi: VAULT_ABI,
                functionName: 'liquidate',
                value: calculation.paymentAmount,
            })
        } catch (error) {
            console.error('Liquidation failed:', error)
            showTransactionError('Liquidation', error)
        }
    }

    // Watch for transaction success
    if (hash && !isPending && !isConfirming) {
        showLiquidationSuccess(`${formatEther(calculation?.bounty || 0n)} CELO`)
    }

    return (
        <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold truncate">{vault.tokenName}</h3>
                    <p className="text-sm text-gray-600 font-mono">${vault.tokenSymbol}</p>
                    <p className="text-xs text-gray-500 font-mono mt-1">{formatAddress(vault.address)}</p>
                </div>
                <div className="text-right ml-4">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 border border-red-200 text-red-700">
                        🔥 {healthPercentage.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Health Ratio</p>
                </div>
            </div>

            {/* Vault Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded">
                <div>
                    <p className="text-xs text-gray-600 mb-1">Creator</p>
                    <p className="font-mono text-sm">{formatAddress(vault.creator)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-600 mb-1">TVL</p>
                    <p className="font-semibold">{formatNumber(tvlInCelo)} CELO</p>
                </div>
                <div>
                    <p className="text-xs text-gray-600 mb-1">Token Price</p>
                    <p className="font-semibold">{pegInCelo.toFixed(4)} CELO</p>
                </div>
                <div>
                    <p className="text-xs text-gray-600 mb-1">Total Supply</p>
                    <p className="font-semibold">{formatNumber(totalSupplyInTokens)}</p>
                </div>
            </div>

            {/* Liquidation Form */}
            <div className="space-y-4">
                <div>
                    <label htmlFor={`payment-${vault.address}`} className="block text-sm font-medium text-gray-700 mb-2">
                        CELO Payment Amount
                    </label>
                    <div className="relative">
                        <input
                            id={`payment-${vault.address}`}
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={paymentAmount}
                            onChange={(e) => handlePaymentChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isPending || isConfirming}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">CELO</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Minimum: 0.01 CELO
                    </p>
                </div>

                {/* Calculation Results */}
                {calculation && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-4 space-y-3">
                        <h4 className="font-semibold text-blue-800">Liquidation Preview</h4>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-blue-600">Tokens to Remove:</p>
                                <p className="font-semibold">{formatNumber(Number(formatEther(calculation.tokensToRemove)))}</p>
                            </div>
                            <div>
                                <p className="text-blue-600">Your Bounty:</p>
                                <p className="font-semibold text-green-600">+{formatEther(calculation.bounty)} CELO</p>
                            </div>
                            <div>
                                <p className="text-blue-600">Creator Penalty:</p>
                                <p className="font-semibold text-red-600">-{formatEther(calculation.creatorPenalty)} CELO</p>
                            </div>
                            <div>
                                <p className="text-blue-600">Health After:</p>
                                <p className={cn(
                                    'font-semibold',
                                    Number(calculation.healthAfter) / 1e16 >= 150 ? 'text-green-600' : 'text-red-600'
                                )}>
                                    {(Number(calculation.healthAfter) / 1e16).toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        {!calculation.isValid && (
                            <div className="text-red-600 text-sm">
                                {calculation.paymentAmount < parseEther('0.01')
                                    ? 'Payment amount too small (minimum 0.01 CELO)'
                                    : 'Insufficient payment to restore health to 150%'
                                }
                            </div>
                        )}
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={handleLiquidate}
                    disabled={!calculation || !calculation.isValid || !userAddress || isPending || isConfirming}
                    className={cn(
                        'w-full py-3 px-4 rounded-md font-semibold transition-colors',
                        calculation && calculation.isValid && userAddress && !isPending && !isConfirming
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    )}
                >
                    {isPending || isConfirming ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {isPending ? 'Confirming...' : 'Processing...'}
                        </div>
                    ) : !userAddress ? (
                        'Connect Wallet to Liquidate'
                    ) : !calculation ? (
                        'Enter Payment Amount'
                    ) : !calculation.isValid ? (
                        'Invalid Payment Amount'
                    ) : (
                        `Liquidate Vault (Earn ${formatEther(calculation.bounty)} CELO)`
                    )}
                </button>
            </div>

            {/* Risk Warning */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <p className="font-semibold mb-1">⚠️ Liquidation Risk</p>
                <p>
                    Ensure you understand the liquidation mechanics. You will inject CELO to restore vault health
                    and earn a 1% bounty. The creator will be penalized. This action cannot be undone.
                </p>
            </div>
        </div>
    )
}