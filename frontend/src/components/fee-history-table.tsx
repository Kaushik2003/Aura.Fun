/**
 * @file Fee history table component
 * @description Displays treasury events (collections and withdrawals) in a table
 */

'use client'

import { formatEther } from 'viem'
import { TreasuryEvent } from '@/types/treasury'

interface FeeHistoryTableProps {
    events: TreasuryEvent[]
    isLoading: boolean
}

export function FeeHistoryTable({ events, isLoading }: FeeHistoryTableProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-lg border">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Transaction History</h3>
                </div>
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex space-x-4">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const formatCelo = (amount: bigint) => {
        const formatted = formatEther(amount)
        return `${parseFloat(formatted).toFixed(4)} CELO`
    }

    const formatDate = (timestamp: bigint) => {
        return new Date(Number(timestamp) * 1000).toLocaleString()
    }

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const getEventTypeColor = (type: TreasuryEvent['type']) => {
        switch (type) {
            case 'TreasuryCollected':
                return 'text-green-600 bg-green-100'
            case 'Withdrawn':
                return 'text-red-600 bg-red-100'
            default:
                return 'text-gray-600 bg-gray-100'
        }
    }

    const getEventTypeLabel = (type: TreasuryEvent['type']) => {
        switch (type) {
            case 'TreasuryCollected':
                return 'Fee Collected'
            case 'Withdrawn':
                return 'Withdrawn'
            default:
                return type
        }
    }

    return (
        <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Transaction History</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Recent treasury collections and withdrawals
                </p>
            </div>

            {events.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No transactions yet</p>
                    <p className="text-sm mt-1">Treasury events will appear here</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Address
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Transaction
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {events.map((event, index) => (
                                <tr key={`${event.transactionHash}-${index}`} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(event.type)}`}>
                                            {getEventTypeLabel(event.type)}
                                        </span>
                                        {event.reason && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {event.reason}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {formatCelo(event.amount)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-mono">
                                            {formatAddress(event.address)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {event.type === 'TreasuryCollected' ? 'Vault' : 'Recipient'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(event.timestamp)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <a
                                            href={`https://celoscan.io/tx/${event.transactionHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 text-sm font-mono"
                                        >
                                            {formatAddress(event.transactionHash)}
                                            <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}