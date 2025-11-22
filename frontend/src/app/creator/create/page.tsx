'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi'
import { parseEther, isAddress } from 'viem'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { getContractAddress } from '../../../../lib/config'
import { FACTORY_ABI } from '../../../../lib/abis'
import { useNetworkConfig } from '../../../../hooks/use-network-config'

// Form validation schema
const createVaultSchema = z.object({
    name: z.string().min(1, 'Token name is required').max(50, 'Token name too long'),
    symbol: z.string().min(1, 'Token symbol is required').max(10, 'Token symbol too long').regex(/^[A-Z0-9]+$/, 'Symbol must be uppercase letters and numbers only'),
    farcasterUsername: z.string().min(1, 'Farcaster username is required').max(50, 'Username too long').regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
})

type CreateVaultForm = z.infer<typeof createVaultSchema>

interface VaultCreationResult {
    vaultAddress: string
    tokenAddress: string
    transactionHash: string
}

interface AuraCalculationResult {
    success: boolean
    aura?: number
    transactionHash?: string
    error?: string
}

export default function CreateVaultPage() {
    const router = useRouter()
    const { address } = useAccount()
    const { isWrongNetwork } = useNetworkConfig()

    // Form state
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        watch,
    } = useForm<CreateVaultForm>({
        resolver: zodResolver(createVaultSchema),
        mode: 'onChange',
    })

    // Creation flow state
    const [creationStep, setCreationStep] = useState<'form' | 'creating' | 'calculating' | 'success' | 'error'>('form')
    const [vaultResult, setVaultResult] = useState<VaultCreationResult | null>(null)
    const [auraResult, setAuraResult] = useState<AuraCalculationResult | null>(null)
    const [errorMessage, setErrorMessage] = useState<string>('')

    // Contract interaction
    const { writeContract, data: hash, error: writeError, isPending: isWritePending } = useWriteContract()

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    })

    // Watch for VaultCreated event
    useWatchContractEvent({
        address: getContractAddress('vaultFactory'),
        abi: FACTORY_ABI,
        eventName: 'VaultCreated',
        args: {
            creator: address,
        },
        onLogs: (logs) => {
            const latestLog = logs[logs.length - 1]
            if (latestLog && hash && latestLog.transactionHash === hash) {
                const { vault, token } = latestLog.args
                if (vault && token) {
                    const result: VaultCreationResult = {
                        vaultAddress: vault,
                        tokenAddress: token,
                        transactionHash: hash,
                    }
                    setVaultResult(result)
                    setCreationStep('calculating')

                    // Start aura calculation
                    calculateAura(vault, watch('farcasterUsername'))
                }
            }
        },
    })

    // Calculate aura score via API
    const calculateAura = async (vaultAddress: string, farcasterUsername: string) => {
        try {
            const response = await fetch('/api/oracle/calculate-aura', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vaultAddress,
                    farcasterUsername,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setAuraResult({
                    success: true,
                    aura: data.aura,
                    transactionHash: data.transactionHash,
                })
                setCreationStep('success')
                toast.success(`Vault created successfully! Initial aura: ${data.aura}/200`)
            } else {
                setAuraResult({
                    success: false,
                    error: data.error || 'Failed to calculate aura',
                })
                setCreationStep('error')
                setErrorMessage(`Vault created but aura calculation failed: ${data.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Aura calculation error:', error)
            setAuraResult({
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            })
            setCreationStep('error')
            setErrorMessage(`Vault created but aura calculation failed: ${error instanceof Error ? error.message : 'Network error'}`)
        }
    }

    // Retry aura calculation
    const retryAuraCalculation = () => {
        if (vaultResult) {
            setCreationStep('calculating')
            setAuraResult(null)
            setErrorMessage('')
            calculateAura(vaultResult.vaultAddress, watch('farcasterUsername'))
        }
    }

    // Handle form submission
    const onSubmit = async (data: CreateVaultForm) => {
        if (!address) {
            toast.error('Please connect your wallet')
            return
        }

        if (isWrongNetwork) {
            toast.error('Please switch to the correct network')
            return
        }

        try {
            setCreationStep('creating')
            setErrorMessage('')

            // Hardcoded base capacity to 4700 tokens as per protocol spec
            // 3450 (Stage 4) + 950 (Stage 3) + 250 (Stage 2) + 50 (Stage 1) = 4700
            const baseCapWei = parseEther('4700')

            writeContract({
                address: getContractAddress('vaultFactory'),
                abi: FACTORY_ABI,
                functionName: 'createVault',
                args: [data.name, data.symbol, address, baseCapWei],
            })
        } catch (error) {
            console.error('Vault creation error:', error)
            setCreationStep('error')
            setErrorMessage(error instanceof Error ? error.message : 'Failed to create vault')
            toast.error('Failed to create vault')
        }
    }

    // Handle navigation to vault
    const goToVault = () => {
        if (vaultResult) {
            router.push(`/creator/vaults/${vaultResult.vaultAddress}`)
        }
    }

    // Handle going back to form
    const goBackToForm = () => {
        setCreationStep('form')
        setVaultResult(null)
        setAuraResult(null)
        setErrorMessage('')
    }

    // Don't render if wallet not connected
    if (!address) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-md mx-auto text-center">
                    <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                    <p className="text-gray-600">Connect your wallet to create a new vault</p>
                </div>
            </div>
        )
    }

    // Render form
    if (creationStep === 'form') {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Create New Vault</h1>
                        <p className="text-gray-600">
                            Deploy a new creator vault with automatic aura score calculation
                        </p>
                    </div>

                    {isWrongNetwork && (
                        <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-6">
                            <p className="text-yellow-800">
                                Please switch to the correct network before creating a vault.
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Token Name
                                </label>
                                <input
                                    {...register('name')}
                                    type="text"
                                    id="name"
                                    placeholder="e.g., Creator Token"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-2">
                                    Token Symbol
                                </label>
                                <input
                                    {...register('symbol')}
                                    type="text"
                                    id="symbol"
                                    placeholder="e.g., CRTR"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {errors.symbol && (
                                    <p className="mt-1 text-sm text-red-600">{errors.symbol.message}</p>
                                )}
                            </div>
                        </div>



                        <div>
                            <label htmlFor="farcasterUsername" className="block text-sm font-medium text-gray-700 mb-2">
                                Farcaster Username
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">@</span>
                                <input
                                    {...register('farcasterUsername')}
                                    type="text"
                                    id="farcasterUsername"
                                    placeholder="username"
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            {errors.farcasterUsername && (
                                <p className="mt-1 text-sm text-red-600">{errors.farcasterUsername.message}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                Your Farcaster username for automatic aura score calculation based on engagement metrics.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!isValid || isWrongNetwork || isWritePending || isConfirming}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isWritePending || isConfirming ? 'Creating Vault...' : 'Create Vault'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    // Render creation progress
    if (creationStep === 'creating') {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-md mx-auto text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold mb-2">Deploying Vault</h2>
                    <p className="text-gray-600 mb-4">
                        Please confirm the transaction in your wallet and wait for deployment...
                    </p>
                    {hash && (
                        <p className="text-sm text-gray-500 font-mono">
                            Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
                        </p>
                    )}
                </div>
            </div>
        )
    }

    // Render aura calculation progress
    if (creationStep === 'calculating') {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-md mx-auto text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold mb-2">Calculating Aura Score</h2>
                    <p className="text-gray-600 mb-4">
                        Fetching your Farcaster metrics and calculating initial aura score...
                    </p>
                    {vaultResult && (
                        <div className="text-sm text-gray-500 space-y-1">
                            <p>✅ Vault deployed: {vaultResult.vaultAddress.slice(0, 10)}...{vaultResult.vaultAddress.slice(-8)}</p>
                            <p>✅ Token deployed: {vaultResult.tokenAddress.slice(0, 10)}...{vaultResult.tokenAddress.slice(-8)}</p>
                            <p>🔄 Calculating aura for @{watch('farcasterUsername')}...</p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Render success screen
    if (creationStep === 'success') {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold mb-4">Vault Created Successfully!</h1>
                    <p className="text-gray-600 mb-8">
                        Your creator vault has been deployed and your initial aura score has been calculated.
                    </p>

                    {vaultResult && auraResult && (
                        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                            <h3 className="text-lg font-semibold mb-4">Vault Details</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Vault Address:</span>
                                    <span className="font-mono text-sm">{vaultResult.vaultAddress}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Token Address:</span>
                                    <span className="font-mono text-sm">{vaultResult.tokenAddress}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Initial Aura Score:</span>
                                    <span className="font-semibold text-purple-600">{auraResult.aura}/200</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Farcaster Username:</span>
                                    <span>@{watch('farcasterUsername')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={goBackToForm}
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Create Another Vault
                        </button>
                        <button
                            onClick={goToVault}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Vault
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Render error screen
    if (creationStep === 'error') {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold mb-4">
                        {vaultResult ? 'Aura Calculation Failed' : 'Vault Creation Failed'}
                    </h1>
                    <p className="text-gray-600 mb-4">{errorMessage}</p>

                    {vaultResult && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <p className="text-yellow-800 text-sm">
                                Your vault was successfully created, but we couldn't calculate the initial aura score.
                                You can set it manually later or retry the calculation.
                            </p>
                            <div className="mt-3 text-left">
                                <p className="text-sm text-yellow-700">
                                    <strong>Vault Address:</strong> {vaultResult.vaultAddress}
                                </p>
                                <p className="text-sm text-yellow-700">
                                    <strong>Token Address:</strong> {vaultResult.tokenAddress}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={goBackToForm}
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            {vaultResult ? 'Create Another Vault' : 'Try Again'}
                        </button>
                        {vaultResult && (
                            <>
                                <button
                                    onClick={retryAuraCalculation}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Retry Aura Calculation
                                </button>
                                <button
                                    onClick={goToVault}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Go to Vault
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return null
}