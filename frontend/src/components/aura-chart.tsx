'use client'

import { Address } from 'viem'
import { useQuery } from '@tanstack/react-query'
import { usePublicClient, useWatchContractEvent } from 'wagmi'
import { getContractAddress } from '../../lib/config'
import { ORACLE_ABI } from '../../lib/abis'

interface AuraChartProps {
    vaultAddress: Address
    currentAura: number
}

interface AuraHistoryEntry {
    aura: number
    timestamp: number
    ipfsHash: string
}

export function AuraChart({ vaultAddress, currentAura }: AuraChartProps) {
    const publicClient = usePublicClient()

    // Fetch aura history from events (simplified for now)
    const { data: auraHistory, refetch } = useQuery({
        queryKey: ['aura-history', vaultAddress],
        queryFn: async (): Promise<AuraHistoryEntry[]> => {
            if (!publicClient) return []

            try {
                // For now, we'll just show the current aura
                // In a full implementation, we'd fetch AuraUpdated events
                const currentTimestamp = Math.floor(Date.now() / 1000)

                return [
                    {
                        aura: currentAura,
                        timestamp: currentTimestamp,
                        ipfsHash: '',
                    }
                ]
            } catch (error) {
                console.error('Failed to fetch aura history:', error)
                return []
            }
        },
        enabled: !!publicClient && !!vaultAddress,
        refetchInterval: 30000, // Refetch every 30 seconds
    })

    // Watch for aura updates
    useWatchContractEvent({
        address: getContractAddress('auraOracle'),
        abi: ORACLE_ABI,
        eventName: 'AuraUpdated',
        args: {
            vault: vaultAddress,
        },
        onLogs: () => {
            refetch()
        },
    })

    // Calculate aura level and color
    const getAuraLevel = (aura: number) => {
        if (aura >= 160) return { level: 'Legendary', color: 'text-purple-600 bg-purple-100' }
        if (aura >= 120) return { level: 'High', color: 'text-blue-600 bg-blue-100' }
        if (aura >= 80) return { level: 'Medium', color: 'text-green-600 bg-green-100' }
        if (aura >= 40) return { level: 'Low', color: 'text-yellow-600 bg-yellow-100' }
        return { level: 'Very Low', color: 'text-red-600 bg-red-100' }
    }

    const auraLevel = getAuraLevel(currentAura)
    const auraPercentage = (currentAura / 200) * 100

    return (
        <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Aura Score</h2>

            {/* Aura Gauge */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Current Aura</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${auraLevel.color}`}>
                        {auraLevel.level}
                    </span>
                </div>

                {/* Circular Progress */}
                <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        {/* Background circle */}
                        <circle
                            cx="60"
                            cy="60"
                            r="50"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-gray-200"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="60"
                            cy="60"
                            r="50"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 50}`}
                            strokeDashoffset={`${2 * Math.PI * 50 * (1 - auraPercentage / 100)}`}
                            className="text-purple-600 transition-all duration-500"
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Center text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{currentAura}</div>
                            <div className="text-xs text-gray-500">/ 200</div>
                        </div>
                    </div>
                </div>

                {/* Linear Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                        className="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${auraPercentage}%` }}
                    />
                </div>

                {/* Scale markers */}
                <div className="flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                    <span>150</span>
                    <span>200</span>
                </div>
            </div>

            {/* Aura Impact */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Token Price Impact</div>
                    <div className="text-lg font-bold text-blue-900">
                        {(0.3 + (2.7 * currentAura / 200)).toFixed(3)} CELO
                    </div>
                    <div className="text-xs text-blue-600">Current peg</div>
                </div>

                <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Supply Cap Impact</div>
                    <div className="text-lg font-bold text-green-900">
                        {((1 + 0.75 * (currentAura - 100) / 100) * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-green-600">of base capacity</div>
                </div>
            </div>

            {/* Aura Explanation */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">About Aura Score</h3>
                <p className="text-sm text-gray-600 mb-2">
                    Aura reflects creator engagement and determines token economics:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Token Price:</strong> Higher aura = higher token price (0.3 - 3.0 CELO)</li>
                    <li>• <strong>Supply Cap:</strong> Higher aura = larger supply capacity</li>
                    <li>• <strong>Updates:</strong> Aura is updated periodically based on creator activity</li>
                </ul>
            </div>

            {/* Recent Updates */}
            {auraHistory && auraHistory.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Updates</h3>
                    <div className="space-y-2">
                        {auraHistory.slice(0, 3).map((entry, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">
                                    {new Date(entry.timestamp * 1000).toLocaleDateString()}
                                </span>
                                <span className="font-semibold">Aura: {entry.aura}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}