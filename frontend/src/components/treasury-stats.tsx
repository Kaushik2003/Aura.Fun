/**
 * @file Treasury statistics component
 * @description Displays treasury balance and aggregate statistics
 */

'use client'

import { formatEther } from 'viem'
import { useTreasuryBalance } from '@/hooks/use-treasury-balance'
import { TreasuryStats as TreasuryStatsType } from '@/types/treasury'

interface TreasuryStatsProps {
    stats: TreasuryStatsType | null
}

export function TreasuryStats({ stats }: TreasuryStatsProps) {
    const { balance, isLoading: balanceLoading } = useTreasuryBalance()

    if (balanceLoading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border p-6">
                        <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const formatCelo = (amount: bigint) => {
        const formatted = formatEther(amount)
        return `${parseFloat(formatted).toFixed(4)} CELO`
    }

    const formatDate = (timestamp?: bigint) => {
        if (!timestamp) return 'Never'
        return new Date(Number(timestamp) * 1000).toLocaleDateString()
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Current Balance */}
            <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Current Balance</p>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCelo(balance)}
                        </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Total Fees Collected */}
            <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Total Fees Collected</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {formatCelo(stats.totalFeesCollected)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.totalCollectionEvents} collections
                        </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Total Withdrawn */}
            <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Total Withdrawn</p>
                        <p className="text-2xl font-bold text-purple-600">
                            {formatCelo(stats.totalWithdrawn)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.totalWithdrawalEvents} withdrawals
                        </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Average Fee */}
            <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Average Fee</p>
                        <p className="text-2xl font-bold text-orange-600">
                            {formatCelo(stats.averageFeePerCollection)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Last: {formatDate(stats.lastCollectionTimestamp)}
                        </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    )
}