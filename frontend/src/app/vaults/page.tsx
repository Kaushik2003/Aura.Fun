'use client'

import { useVaults } from '../../../hooks/use-vaults'
import { FanVaultCard } from '../../components/fan-vault-card'
import { VaultFilters } from '../../components/vault-filters'
import { VaultCardSkeleton } from '../../components/vault-card-skeleton'
import { useState } from 'react'
import { VaultFilters as VaultFiltersType, VaultSortOptions } from '../../../types/vault'

export default function VaultsPage() {
    const { vaults, isLoading } = useVaults()

    console.log('🏛️ VaultsPage render - vaults:', vaults, 'isLoading:', isLoading)
    const [filters, setFilters] = useState<VaultFiltersType>({
        creator: '',
        healthMin: 0,
        healthMax: 999999, // Very high to show all vaults for MVP testing
        stage: null,
        tvlMin: 0,
        auraMin: 0,
        auraMax: 10000, // Very high to show all vaults for MVP testing
    })
    const [sortOptions, setSortOptions] = useState<VaultSortOptions>({
        sortBy: 'tvl',
        sortOrder: 'desc',
    })

    // Filter vaults based on current filters
    const filteredVaults = vaults?.filter(vault => {
        // Creator filter (case-insensitive partial match)
        if (filters.creator && !vault.creator.toLowerCase().includes(filters.creator.toLowerCase())) {
            return false
        }

        // Health filter - DISABLED for MVP testing to show all vaults
        // TODO: Re-enable health filtering after MVP testing
        console.log('🏛️ Health check: SKIPPED for MVP testing - showing all vaults')

        // Stage filter
        if (filters.stage !== null && vault.stage !== filters.stage) {
            return false
        }

        // TVL filter (convert from wei to CELO)
        const tvlInCelo = Number(vault.totalCollateral) / 1e18
        if (tvlInCelo < (filters.tvlMin || 0)) {
            return false
        }

        // Aura filter - Made more permissive for MVP testing
        console.log('🏛️ Aura check:', { aura: vault.aura, min: filters.auraMin, max: filters.auraMax })
        if (vault.aura < (filters.auraMin || 0) || vault.aura > (filters.auraMax || 10000)) {
            console.log('❌ Filtered out by aura')
            return false
        }

        return true
    })

    // Sort filtered vaults
    const sortedVaults = filteredVaults?.sort((a, b) => {
        const multiplier = sortOptions.sortOrder === 'asc' ? 1 : -1

        switch (sortOptions.sortBy) {
            case 'tvl':
                return (Number(a.totalCollateral) - Number(b.totalCollateral)) * multiplier
            case 'aura':
                return (a.aura - b.aura) * multiplier
            case 'health':
                return (Number(a.health) - Number(b.health)) * multiplier
            case 'stage':
                return (a.stage - b.stage) * multiplier
            default:
                return 0
        }
    })

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Discover Creator Vaults</h1>
                    <p className="text-gray-600">Browse and invest in creator tokens</p>
                </div>
                <VaultCardSkeleton count={6} />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Discover Creator Vaults</h1>
                    <p className="text-gray-600">Browse and invest in creator tokens</p>
                </div>
                <div className="text-sm text-gray-500">
                    {sortedVaults?.length || 0} vaults found
                </div>
            </div>

            <VaultFilters
                filters={filters}
                onFiltersChange={setFilters}
                sortOptions={sortOptions}
                onSortOptionsChange={setSortOptions}
            />

            {sortedVaults && sortedVaults.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No vaults found</h3>
                    <p className="text-gray-500">Try adjusting your filters to see more results</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {sortedVaults?.map(vault => (
                        <FanVaultCard key={vault.address} vault={vault} />
                    ))}
                </div>
            )}
        </div>
    )
}