'use client'

import { VaultState } from '../../types/vault'
import { formatEther } from 'viem'
import { formatNumber, formatPercentage } from '../../lib/utils'
import { calculateHealth } from '../../lib/calculations'

interface VaultAnalyticsProps {
    vault: VaultState
}

export function VaultAnalytics({ vault }: VaultAnalyticsProps) {
    // Calculate metrics
    const healthPercentage = calculateHealth(vault.totalCollateral, vault.totalSupply, vault.peg)
    const pegInCelo = Number(formatEther(vault.peg))
    const tvl = Number(formatEther(vault.totalCollateral))
    const creatorCollateralCelo = Number(formatEther(vault.creatorCollateral))
    const fanCollateralCelo = Number(formatEther(vault.fanCollateral))
    const totalSupplyNumber = Number(formatEther(vault.totalSupply))
    const supplyCapNumber = Number(formatEther(vault.supplyCap))
    const supplyUtilization = supplyCapNumber > 0 ? (totalSupplyNumber / supplyCapNumber) * 100 : 0

    // Calculate potential metrics for different scenarios
    const calculateScenarios = () => {
        const scenarios = []

        // Scenario 1: If aura increases by 20 points
        const higherAura = Math.min(200, vault.aura + 20)
        const higherAuraPeg = 0.3 + (2.7 * higherAura / 200)
        const higherAuraSupplyCap = Number(vault.baseCap) / 1e18 * (1 + 0.75 * (higherAura - 100) / 100)
        scenarios.push({
            name: 'Aura +20',
            aura: higherAura,
            peg: higherAuraPeg,
            supplyCap: higherAuraSupplyCap,
            color: 'green'
        })

        // Scenario 2: If aura decreases by 20 points
        const lowerAura = Math.max(0, vault.aura - 20)
        const lowerAuraPeg = 0.3 + (2.7 * lowerAura / 200)
        const lowerAuraSupplyCap = Number(vault.baseCap) / 1e18 * (1 + 0.75 * (lowerAura - 100) / 100)
        scenarios.push({
            name: 'Aura -20',
            aura: lowerAura,
            peg: lowerAuraPeg,
            supplyCap: lowerAuraSupplyCap,
            color: 'red'
        })

        return scenarios
    }

    const scenarios = calculateScenarios()

    // Risk assessment
    const getRiskLevel = () => {
        if (healthPercentage < 120) return { level: 'High', color: 'red', description: 'Liquidation risk' }
        if (healthPercentage < 150) return { level: 'Medium', color: 'yellow', description: 'Health warning' }
        if (supplyUtilization > 90) return { level: 'Medium', color: 'yellow', description: 'Near supply cap' }
        return { level: 'Low', color: 'green', description: 'Operating normally' }
    }

    const risk = getRiskLevel()

    // Performance metrics
    const performanceMetrics = [
        {
            name: 'Collateralization Ratio',
            value: formatPercentage(healthPercentage, 1),
            target: '≥150%',
            status: healthPercentage >= 150 ? 'good' : healthPercentage >= 120 ? 'warning' : 'danger'
        },
        {
            name: 'Supply Utilization',
            value: formatPercentage(supplyUtilization, 1),
            target: '<90%',
            status: supplyUtilization < 90 ? 'good' : supplyUtilization < 95 ? 'warning' : 'danger'
        },
        {
            name: 'Aura Score',
            value: `${vault.aura}/200`,
            target: '≥100',
            status: vault.aura >= 100 ? 'good' : vault.aura >= 50 ? 'warning' : 'danger'
        },
        {
            name: 'Stage Progress',
            value: `${vault.stage}/4`,
            target: 'Stage 4',
            status: vault.stage === 4 ? 'good' : vault.stage >= 2 ? 'warning' : 'danger'
        }
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good': return 'text-green-600 bg-green-50 border-green-200'
            case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
            case 'danger': return 'text-red-600 bg-red-50 border-red-200'
            default: return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    return (
        <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Vault Analytics</h2>

            {/* Risk Assessment */}
            <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Risk Assessment</h3>
                <div className={`p-4 rounded-lg border ${getStatusColor(risk.level.toLowerCase())}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold">{risk.level} Risk</h4>
                            <p className="text-sm opacity-75">{risk.description}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{formatPercentage(healthPercentage, 0)}</div>
                            <div className="text-xs">Health Ratio</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {performanceMetrics.map((metric, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${getStatusColor(metric.status)}`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-sm">{metric.name}</div>
                                    <div className="text-xs opacity-75">Target: {metric.target}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{metric.value}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Aura Impact Analysis */}
            <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Aura Impact Analysis</h3>
                <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Current State</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="text-gray-600">Aura Score</div>
                                <div className="font-semibold">{vault.aura}/200</div>
                            </div>
                            <div>
                                <div className="text-gray-600">Token Price</div>
                                <div className="font-semibold">{pegInCelo.toFixed(3)} CELO</div>
                            </div>
                            <div>
                                <div className="text-gray-600">Supply Cap</div>
                                <div className="font-semibold">{formatNumber(supplyCapNumber)}</div>
                            </div>
                        </div>
                    </div>

                    {scenarios.map((scenario, index) => (
                        <div key={index} className={`border rounded-lg p-4 ${scenario.color === 'green' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                            }`}>
                            <h4 className="font-medium mb-2">{scenario.name} Scenario</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div className={`${scenario.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
                                        Aura Score
                                    </div>
                                    <div className="font-semibold">{scenario.aura}/200</div>
                                    <div className="text-xs opacity-75">
                                        {scenario.aura > vault.aura ? '+' : ''}{scenario.aura - vault.aura}
                                    </div>
                                </div>
                                <div>
                                    <div className={`${scenario.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
                                        Token Price
                                    </div>
                                    <div className="font-semibold">{scenario.peg.toFixed(3)} CELO</div>
                                    <div className="text-xs opacity-75">
                                        {scenario.peg > pegInCelo ? '+' : ''}{(scenario.peg - pegInCelo).toFixed(3)}
                                    </div>
                                </div>
                                <div>
                                    <div className={`${scenario.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
                                        Supply Cap
                                    </div>
                                    <div className="font-semibold">{formatNumber(scenario.supplyCap)}</div>
                                    <div className="text-xs opacity-75">
                                        {scenario.supplyCap > supplyCapNumber ? '+' : ''}{formatNumber(scenario.supplyCap - supplyCapNumber)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Key Insights */}
            <div>
                <h3 className="text-lg font-medium mb-3">Key Insights</h3>
                <div className="space-y-3">
                    {/* Health insight */}
                    {healthPercentage < 150 && (
                        <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium text-yellow-800">Health Warning</div>
                                <div className="text-sm text-yellow-700">
                                    Consider adding more collateral to improve vault health above 150%.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Supply cap insight */}
                    {supplyUtilization > 80 && (
                        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium text-blue-800">Supply Cap Approaching</div>
                                <div className="text-sm text-blue-700">
                                    Your vault is {formatPercentage(supplyUtilization, 0)} full. Focus on improving aura to increase capacity.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Aura insight */}
                    {vault.aura < 100 && (
                        <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium text-purple-800">Aura Below Average</div>
                                <div className="text-sm text-purple-700">
                                    Your aura score is below 100. Increase engagement to improve token price and supply cap.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stage insight */}
                    {vault.stage < 4 && (
                        <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium text-green-800">Stage Unlock Opportunity</div>
                                <div className="text-sm text-green-700">
                                    You can unlock Stage {vault.stage + 1} to increase mint capacity for your fans.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}