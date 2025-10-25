'use client'

import { formatEther } from 'viem'

interface CreatorStatsProps {
    stats: {
        totalVaults: number
        totalCreatorCollateral: bigint
        totalFanCollateral: bigint
        totalTVL: bigint
        totalSupply: bigint
        averageAura: number
        averageHealth: number
        activeVaults: number
        liquidatableVaults: number
    }
}

export function CreatorStats({ stats }: CreatorStatsProps) {
    const statCards = [
        {
            title: 'Total Vaults',
            value: stats.totalVaults.toString(),
            subtitle: `${stats.activeVaults} active`,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            color: 'blue',
        },
        {
            title: 'Total TVL',
            value: `${parseFloat(formatEther(stats.totalTVL)).toFixed(2)} CELO`,
            subtitle: `${parseFloat(formatEther(stats.totalCreatorCollateral)).toFixed(2)} yours`,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
            ),
            color: 'green',
        },
        {
            title: 'Average Aura',
            value: `${stats.averageAura}/200`,
            subtitle: 'Engagement score',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            color: 'purple',
        },
        {
            title: 'Average Health',
            value: `${stats.averageHealth.toFixed(0)}%`,
            subtitle: stats.liquidatableVaults > 0 ? `${stats.liquidatableVaults} at risk` : 'All healthy',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            ),
            color: stats.liquidatableVaults > 0 ? 'red' : 'green',
        },
    ]

    const getColorClasses = (color: string) => {
        const colors = {
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            green: 'bg-green-50 text-green-600 border-green-200',
            purple: 'bg-purple-50 text-purple-600 border-purple-200',
            red: 'bg-red-50 text-red-600 border-red-200',
        }
        return colors[color as keyof typeof colors] || colors.blue
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, index) => (
                <div
                    key={index}
                    className={`border rounded-lg p-4 ${getColorClasses(stat.color)}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            {stat.icon}
                            <h3 className="font-medium text-sm">{stat.title}</h3>
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                        <p className="text-sm text-gray-600">{stat.subtitle}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}