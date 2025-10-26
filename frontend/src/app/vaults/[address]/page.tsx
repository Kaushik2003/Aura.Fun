'use client'

import { useVaultState } from '../../../../hooks/use-vault-state'
import { useAccount } from 'wagmi'
import { FanVaultMetrics } from '../../../components/fan-vault-metrics'
import { AuraChart } from '../../../components/aura-chart'
import { ForcedBurnAlert } from '../../../components/forced-burn-alert'
import { UserPositions } from '../../../components/user-positions'
import { VaultDetailSkeleton } from '../../../components/vault-detail-skeleton'
import { MintForm } from '../../../components/mint-form'
import { RedeemForm } from '../../../components/redeem-form'
import { Address } from 'viem'
import React from 'react'

interface FanVaultDetailPageProps {
    params: Promise<{
        address: string
    }>
}

export default function FanVaultDetailPage({ params }: FanVaultDetailPageProps) {
    const { address: userAddress } = useAccount()
    const resolvedParams = React.use(params)
    const { vault, isLoading, error, refetch } = useVaultState(resolvedParams.address as Address)

    if (isLoading) {
        return <VaultDetailSkeleton />
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Vault</h2>
                    <p className="text-gray-600 mb-4">Failed to load vault information</p>
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

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">{vault.tokenName}</h1>
                <p className="text-gray-600">Invest in this creator's token</p>
                <p className="text-sm text-gray-500 font-mono mt-1">
                    Vault: {resolvedParams.address}
                </p>
            </div>

            {/* Forced Burn Alert */}
            {vault.pendingForcedBurn > 0n && (
                <div className="mb-6">
                    <ForcedBurnAlert vault={vault} onExecuted={refetch} />
                </div>
            )}

            {/* Bootstrap Status Message */}
            {vault.stage === 0 && (
                <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Vault Not Active
                            </h3>
                            <p className="text-sm text-yellow-700 mt-1">
                                This vault is not yet active. The creator needs to bootstrap it with 0.001 CELO first.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Metrics and Charts */}
                <div className="lg:col-span-2 space-y-6">
                    <FanVaultMetrics vault={vault} />
                    <AuraChart vaultAddress={resolvedParams.address as Address} currentAura={vault.aura} />

                    {/* User Positions */}
                    {userAddress && (
                        <UserPositions
                            vaultAddress={resolvedParams.address as Address}
                            userAddress={userAddress}
                        />
                    )}
                </div>

                {/* Right Column - Actions */}
                <div className="space-y-6">
                    {vault.stage > 0 ? (
                        <>
                            {/* Mint Form */}
                            <MintForm vault={vault} onSuccess={refetch} />

                            {/* Redeem Form */}
                            <RedeemForm vault={vault} userAddress={userAddress} onSuccess={refetch} />
                        </>
                    ) : (
                        <div className="border rounded-lg p-6 text-center text-gray-600">
                            <div className="mb-4">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <p className="font-medium">Minting Not Available</p>
                            <p className="text-sm mt-2">Wait for creator to bootstrap vault</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}