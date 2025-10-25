'use client'

import { useUserPositions } from '../../hooks/use-user-positions'
import { Address, formatEther } from 'viem'
import { formatNumber } from '../../lib/utils'

interface UserPositionsProps {
    vaultAddress: Address
    userAddress: Address
}

export function UserPositions({ vaultAddress, userAddress }: UserPositionsProps) {
    const { positions, isLoading, error } = useUserPositions(vaultAddress, userAddress)

    if (isLoading) {
        return (
            <div className="bg-white border rounded-lg p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white border rounded-lg p-6">
                <div className="text-center text-red-600">
                    <p>Failed to load positions</p>
                    <p className="text-sm text-gray-500 mt-1">Please try refreshing the page</p>
                </div>
            </div>
        )
    }

    if (positions.length === 0) {
        return (
            <div className="bg-white border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Your Positions</h2>
                <div className="text-center text-gray-500 py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-lg font-medium">No positions yet</p>
                    <p className="text-sm mt-1">Mint some tokens to see your positions here</p>
                </div>
            </div>
        )
    }

    // Calculate totals
    const totalTokens = positions.reduce((sum, pos) => sum + pos.qty, 0n)
    const totalCollateral = positions.reduce((sum, pos) => sum + pos.collateral, 0n)

    return (
        <div className="bg-white border rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Your Positions</h2>
                <div className="text-sm text-gray-600">
                    {positions.length} position{positions.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600 font-medium">Total Tokens</div>
                    <div className="text-xl font-bold text-blue-900">
                        {formatNumber(Number(formatEther(totalTokens)))}
                    </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 font-medium">Total Collateral</div>
                    <div className="text-xl font-bold text-green-900">
                        {formatNumber(Number(formatEther(totalCollateral)))} CELO
                    </div>
                </div>
            </div>

            {/* FIFO Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                    <svg className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-yellow-800">
                        <strong>FIFO Redemption:</strong> When you redeem tokens, positions are processed from oldest to newest (top to bottom).
                    </span>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Order</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Tokens</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Collateral</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Stage</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.map((position, index) => (
                            <tr
                                key={`${position.index}-${position.createdAt}`}
                                className={`border-b border-gray-100 hover:bg-gray-50 ${index === 0 ? 'bg-blue-50' : ''
                                    }`}
                            >
                                <td className="py-3 px-2">
                                    <div className="flex items-center">
                                        <span className="font-medium">#{index + 1}</span>
                                        {index === 0 && (
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                                Next to redeem
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-2 font-semibold">
                                    {formatNumber(Number(formatEther(position.qty)))}
                                </td>
                                <td className="py-3 px-2 font-semibold">
                                    {formatNumber(Number(formatEther(position.collateral)))} CELO
                                </td>
                                <td className="py-3 px-2">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                        Stage {position.stage}
                                    </span>
                                </td>
                                <td className="py-3 px-2 text-gray-600">
                                    {new Date(Number(position.createdAt) * 1000).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {positions.map((position, index) => (
                    <div
                        key={`${position.index}-${position.createdAt}`}
                        className={`border rounded-lg p-4 ${index === 0 ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center">
                                <span className="font-medium">Position #{index + 1}</span>
                                {index === 0 && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                        Next
                                    </span>
                                )}
                            </div>
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                Stage {position.stage}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                                <div className="text-gray-600 mb-1">Tokens</div>
                                <div className="font-semibold">{formatNumber(Number(formatEther(position.qty)))}</div>
                            </div>
                            <div>
                                <div className="text-gray-600 mb-1">Collateral</div>
                                <div className="font-semibold">{formatNumber(Number(formatEther(position.collateral)))} CELO</div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 border-t pt-2">
                            Created: {new Date(Number(position.createdAt) * 1000).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}