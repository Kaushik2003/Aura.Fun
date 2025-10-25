'use client'

export function VaultDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="mb-6">
                <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-48 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-80"></div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Metrics and Charts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Metrics Skeleton */}
                    <div className="bg-white border rounded-lg p-6">
                        <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                                    <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                                </div>
                            ))}
                        </div>

                        {/* Detailed Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[...Array(2)].map((_, i) => (
                                <div key={i}>
                                    <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
                                    <div className="space-y-3">
                                        {[...Array(3)].map((_, j) => (
                                            <div key={j} className="flex justify-between items-center">
                                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Aura Chart Skeleton */}
                    <div className="bg-white border rounded-lg p-6">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>

                        {/* Circular Progress Skeleton */}
                        <div className="flex justify-center mb-6">
                            <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
                        </div>

                        {/* Progress Bar Skeleton */}
                        <div className="w-full h-3 bg-gray-200 rounded-full mb-2"></div>
                        <div className="flex justify-between mb-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-3 bg-gray-200 rounded w-4"></div>
                            ))}
                        </div>

                        {/* Impact Cards Skeleton */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                    <div className="h-6 bg-gray-200 rounded w-20 mb-1"></div>
                                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                                </div>
                            ))}
                        </div>

                        {/* Explanation Skeleton */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="space-y-1">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-3 bg-gray-200 rounded w-5/6"></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* User Positions Skeleton */}
                    <div className="bg-white border rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="h-6 bg-gray-200 rounded w-32"></div>
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>

                        {/* Summary Cards Skeleton */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-4">
                                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                                </div>
                            ))}
                        </div>

                        {/* Table Skeleton */}
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100">
                                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                    <div className="h-4 bg-gray-200 rounded w-14"></div>
                                    <div className="h-4 bg-gray-200 rounded w-18"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Actions Skeleton */}
                <div className="space-y-6">
                    {/* Mint Form Skeleton */}
                    <div className="border rounded-lg p-6">
                        <div className="h-5 bg-gray-200 rounded w-24 mb-4"></div>
                        <div className="space-y-4">
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                                <div className="h-10 bg-gray-200 rounded w-full"></div>
                            </div>
                            <div className="space-y-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex justify-between">
                                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="h-10 bg-gray-200 rounded w-full"></div>
                        </div>
                    </div>

                    {/* Redeem Form Skeleton */}
                    <div className="border rounded-lg p-6">
                        <div className="h-5 bg-gray-200 rounded w-28 mb-4"></div>
                        <div className="space-y-4">
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                                <div className="h-10 bg-gray-200 rounded w-full"></div>
                            </div>
                            <div className="space-y-2">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="flex justify-between">
                                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="h-10 bg-gray-200 rounded w-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}