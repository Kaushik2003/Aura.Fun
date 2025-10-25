'use client'

import { useState } from 'react'
import { VaultFilters as VaultFiltersType, VaultSortOptions } from '../../types/vault'
import { cn } from '../../lib/utils'

interface VaultFiltersProps {
    filters: VaultFiltersType
    onFiltersChange: (filters: VaultFiltersType) => void
    sortOptions: VaultSortOptions
    onSortOptionsChange: (sortOptions: VaultSortOptions) => void
}

export function VaultFilters({
    filters,
    onFiltersChange,
    sortOptions,
    onSortOptionsChange,
}: VaultFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const handleFilterChange = (key: keyof VaultFiltersType, value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        })
    }

    const handleSortChange = (key: keyof VaultSortOptions, value: any) => {
        onSortOptionsChange({
            ...sortOptions,
            [key]: value,
        })
    }

    const clearFilters = () => {
        onFiltersChange({
            creator: '',
            healthMin: 0,
            healthMax: 300,
            stage: null,
            tvlMin: 0,
            auraMin: 0,
            auraMax: 200,
        })
    }

    const hasActiveFilters =
        filters.creator ||
        filters.healthMin !== 0 ||
        filters.healthMax !== 300 ||
        filters.stage !== null ||
        filters.tvlMin !== 0 ||
        filters.auraMin !== 0 ||
        filters.auraMax !== 200

    return (
        <div className="bg-white border rounded-lg p-4 mb-6">
            {/* Quick Sort Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Sort by:</label>
                    <select
                        value={sortOptions.sortBy}
                        onChange={(e) => handleSortChange('sortBy', e.target.value)}
                        className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="tvl">TVL</option>
                        <option value="aura">Aura Score</option>
                        <option value="health">Health</option>
                        <option value="stage">Stage</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleSortChange('sortOrder', 'desc')}
                        className={cn(
                            'px-3 py-1 text-sm rounded border',
                            sortOptions.sortOrder === 'desc'
                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                        )}
                    >
                        High to Low
                    </button>
                    <button
                        onClick={() => handleSortChange('sortOrder', 'asc')}
                        className={cn(
                            'px-3 py-1 text-sm rounded border',
                            sortOptions.sortOrder === 'asc'
                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                        )}
                    >
                        Low to High
                    </button>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                        <span>Filters</span>
                        {hasActiveFilters && (
                            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                Active
                            </span>
                        )}
                        <svg
                            className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <div className="border-t pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Creator Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Creator Address
                            </label>
                            <input
                                type="text"
                                value={filters.creator || ''}
                                onChange={(e) => handleFilterChange('creator', e.target.value)}
                                placeholder="0x... or partial address"
                                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Stage Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stage
                            </label>
                            <select
                                value={filters.stage ?? ''}
                                onChange={(e) => handleFilterChange('stage', e.target.value === '' ? null : Number(e.target.value))}
                                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Stages</option>
                                <option value="0">Stage 0 (Not Bootstrapped)</option>
                                <option value="1">Stage 1</option>
                                <option value="2">Stage 2</option>
                                <option value="3">Stage 3</option>
                                <option value="4">Stage 4 (Max)</option>
                            </select>
                        </div>

                        {/* TVL Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Min TVL (CELO)
                            </label>
                            <input
                                type="number"
                                value={filters.tvlMin || ''}
                                onChange={(e) => handleFilterChange('tvlMin', Number(e.target.value) || 0)}
                                placeholder="0"
                                min="0"
                                step="100"
                                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Health Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Health Range (%)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={filters.healthMin || ''}
                                    onChange={(e) => handleFilterChange('healthMin', Number(e.target.value) || 0)}
                                    placeholder="0"
                                    min="0"
                                    max="300"
                                    className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                    type="number"
                                    value={filters.healthMax || ''}
                                    onChange={(e) => handleFilterChange('healthMax', Number(e.target.value) || 300)}
                                    placeholder="300"
                                    min="0"
                                    max="300"
                                    className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span className="text-red-500">&lt;120% Liquidatable</span>
                                <span className="text-yellow-500">120-150% At Risk</span>
                                <span className="text-green-500">&gt;150% Healthy</span>
                            </div>
                        </div>

                        {/* Aura Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Aura Score Range
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={filters.auraMin || ''}
                                    onChange={(e) => handleFilterChange('auraMin', Number(e.target.value) || 0)}
                                    placeholder="0"
                                    min="0"
                                    max="200"
                                    className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                    type="number"
                                    value={filters.auraMax || ''}
                                    onChange={(e) => handleFilterChange('auraMax', Number(e.target.value) || 200)}
                                    placeholder="200"
                                    min="0"
                                    max="200"
                                    className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Higher aura = higher token price and supply cap
                            </div>
                        </div>
                    </div>

                    {/* Quick Filter Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <span className="text-sm font-medium text-gray-700">Quick filters:</span>
                        <button
                            onClick={() => handleFilterChange('healthMin', 150)}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                            Healthy (≥150%)
                        </button>
                        <button
                            onClick={() => {
                                handleFilterChange('healthMin', 120)
                                handleFilterChange('healthMax', 150)
                            }}
                            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                        >
                            At Risk (120-150%)
                        </button>
                        <button
                            onClick={() => handleFilterChange('healthMax', 120)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                            Liquidatable (&lt;120%)
                        </button>
                        <button
                            onClick={() => handleFilterChange('stage', 0)}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                            Not Bootstrapped
                        </button>
                        <button
                            onClick={() => handleFilterChange('auraMin', 150)}
                            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                        >
                            High Aura (≥150)
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}