/**
 * @file Admin panel page
 * @description Treasury management dashboard for protocol owner
 */

'use client'

import { useAccount, useReadContract } from 'wagmi'
import { redirect } from 'next/navigation'
import { useTreasuryBalance } from '@/hooks/use-treasury-balance'
import { useTreasuryEvents } from '@/hooks/use-treasury-events'
import { TreasuryStats } from '@/components/treasury-stats'
import { WithdrawalForm } from '@/components/withdrawal-form'
import { FeeHistoryTable } from '@/components/fee-history-table'
import { TREASURY_ABI } from '@/lib/abis'
import { getContractAddress } from '@/lib/config'

export default function AdminPage() {
    const { address, isConnected } = useAccount()
    const { balance, refetch: refetchBalance } = useTreasuryBalance()
    const { events, stats, isLoading: eventsLoading, refetch: refetchEvents } = useTreasuryEvents()

    // Check if user is treasury owner
    const { data: treasuryOwner, isLoading: ownerLoading } = useReadContract({
        address: getContractAddress('treasury'),
        abi: TREASURY_ABI,
        functionName: 'owner',
    })

    // Redirect if not connected
    if (!isConnected) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                    <p className="text-gray-600">Connect your wallet to access the admin panel</p>
                </div>
            </div>
        )
    }

    // Show loading while checking owner
    if (ownerLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking permissions...</p>
                </div>
            </div>
        )
    }

    // Check if user is the treasury owner
    const isOwner = address && treasuryOwner && address.toLowerCase() === treasuryOwner.toLowerCase()

    if (!isOwner) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                    <p className="text-gray-600">Only the treasury owner can access this panel</p>
                    <div className="mt-4 text-sm text-gray-500">
                        <p>Your address: {address}</p>
                        <p>Treasury owner: {treasuryOwner}</p>
                    </div>
                </div>
            </div>
        )
    }

    const handleWithdrawalSuccess = () => {
        refetchBalance()
        refetchEvents()
    }

    // Update stats with current balance
    const updatedStats = stats ? {
        ...stats,
        currentBalance: balance
    } : null

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Treasury Admin Panel</h1>
                <p className="text-gray-600 mt-2">
                    Manage protocol treasury and monitor fee collections
                </p>
            </div>

            {/* Treasury Statistics */}
            <TreasuryStats stats={updatedStats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Withdrawal Form */}
                <div className="lg:col-span-1">
                    <WithdrawalForm
                        currentBalance={balance}
                        onSuccess={handleWithdrawalSuccess}
                    />
                </div>

                {/* Fee History Table */}
                <div className="lg:col-span-2">
                    <FeeHistoryTable
                        events={events}
                        isLoading={eventsLoading}
                    />
                </div>
            </div>

            {/* Additional Info */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Treasury Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-blue-700 font-medium">Treasury Contract:</p>
                        <p className="font-mono text-blue-600">{getContractAddress('treasury')}</p>
                    </div>
                    <div>
                        <p className="text-blue-700 font-medium">Owner Address:</p>
                        <p className="font-mono text-blue-600">{treasuryOwner}</p>
                    </div>
                    <div>
                        <p className="text-blue-700 font-medium">Fee Rate:</p>
                        <p className="text-blue-600">0.5% of mint collateral</p>
                    </div>
                    <div>
                        <p className="text-blue-700 font-medium">Collection Method:</p>
                        <p className="text-blue-600">Automatic on token minting</p>
                    </div>
                </div>
            </div>
        </div>
    )
}