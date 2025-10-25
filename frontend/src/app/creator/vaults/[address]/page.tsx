'use client'

import { useVaultState } from '../../../../../hooks/use-vault-state'
import { useAccount } from 'wagmi'
import { CreatorVaultMetrics } from '../../../../components/creator-vault-metrics'
import { VaultAnalytics } from '../../../../components/vault-analytics'
import { ForcedBurnAlert } from '../../../../components/forced-burn-alert'
import { VaultDetailSkeleton } from '../../../../components/vault-detail-skeleton'
import { BootstrapForm } from '../../../../components/bootstrap-form'
import { StageUnlockForm } from '../../../../components/stage-unlock-form'
import { Address } from 'viem'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'
import React from 'react'

interface CreatorVaultManagementPageProps {
    params: Promise<{
        address: string
    }>
}

export default function CreatorVaultManagementPage({ params }: CreatorVaultManagementPageProps) {
    const { address: userAddress } = useAccount()
    const resolvedParams = React.use(params)
    const { vault, isLoading, error, refetch } = useVaultState(resolvedParams.address as Address)

    // Access control - redirect non-creators to fan view
    useEffect(() => {
        if (vault && userAddress && vault.creator.toLowerCase() !== userAddress.toLowerCase()) {
            redirect(`/vaults/${resolvedParams.address}`)
        }
    }, [vault, userAddress, resolvedParams.address])

    if (isLoading) {
        return <VaultDetailSkeleton />
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Vault</h2>
                    <p className="text-gray-600 mb-4">Failed to load vault management information</p>
                    <button
                        onClick={() => refetch()}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    if (!vault) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Vault Not Found</h2>
                    <p className="text-gray-600">The requested vault could not be found</p>
                </div>
            </div>
        )
    }

    // Check if user is the creator
    if (!userAddress || vault.creator.toLowerCase() !== userAddress.toLowerCase()) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                    <p className="text-gray-600 mb-4">You are not the creator of this vault</p>
                    <a
                        href={`/vaults/${resolvedParams.address}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
                    >
                        View as Fan
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{vault.tokenName}</h1>
                        <p className="text-gray-600">Manage your creator vault</p>
                        <p className="text-sm text-gray-500 font-mono mt-1">
                            Vault: {resolvedParams.address}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
                            <p className="text-sm text-purple-600 font-medium">Creator Dashboard</p>
                            <p className="text-xs text-purple-500">Management View</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forced Burn Alert */}
            {vault.pendingForcedBurn > 0n && (
                <div className="mb-6">
                    <ForcedBurnAlert vault={vault} onExecuted={refetch} />
                </div>
            )}

            {/* Vault Status Information */}
            <div className="mb-6">
                {vault.stage === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                    Vault Needs Bootstrap
                                </h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Your vault is not active yet. Deposit 100 CELO to unlock Stage 1 and enable fan minting.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : Number(vault.health) < 1.2e18 ? (
                    <div className="bg-red-50 border border-red-400 rounded-lg p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Liquidation Risk
                                </h3>
                                <p className="text-sm text-red-700 mt-1">
                                    Your vault health is below 120%. Add more collateral or risk liquidation.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-50 border border-green-400 rounded-lg p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">
                                    Vault Healthy
                                </h3>
                                <p className="text-sm text-green-700 mt-1">
                                    Your vault is operating normally with good health ratio.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Metrics and Analytics */}
                <div className="lg:col-span-2 space-y-6">
                    <CreatorVaultMetrics vault={vault} />
                    <VaultAnalytics vault={vault} />
                </div>

                {/* Right Column - Management Actions */}
                <div className="space-y-6">
                    {vault.stage === 0 ? (
                        <BootstrapForm vault={vault} onSuccess={refetch} />
                    ) : (
                        <StageUnlockForm vault={vault} onSuccess={refetch} />
                    )}
                </div>
            </div>
        </div>
    )
}