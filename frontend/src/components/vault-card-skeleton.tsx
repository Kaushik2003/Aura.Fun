'use client'

interface VaultCardSkeletonProps {
    count?: number
}

export function VaultCardSkeleton({ count = 6 }: VaultCardSkeletonProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="border rounded-lg p-6 bg-white animate-pulse">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="text-right ml-4">
                            <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                            <div className="h-6 bg-gray-200 rounded w-12"></div>
                        </div>
                    </div>

                    {/* Creator Info */}
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-center">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="space-y-3 mb-4">
                        {Array.from({ length: 4 }, (_, j) => (
                            <div key={j} className="flex justify-between items-center">
                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                                <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </div>
                        ))}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="flex justify-between mb-1">
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                            <div className="h-3 bg-gray-200 rounded w-8"></div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gray-300 h-2 rounded-full w-1/3"></div>
                        </div>
                    </div>

                    {/* Status Tags */}
                    <div className="flex gap-2 mb-4">
                        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </div>

                    {/* Investment Appeal */}
                    <div className="pt-3 border-t">
                        <div className="flex items-center justify-between">
                            <div className="h-4 bg-gray-200 rounded w-28"></div>
                            <div className="flex gap-1">
                                {Array.from({ length: 5 }, (_, k) => (
                                    <div key={k} className="w-2 h-2 bg-gray-200 rounded-full"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export function VaultDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 animate-pulse">
            {/* Header */}
            <div className="mb-6">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>

            {/* Alert placeholder */}
            <div className="h-16 bg-gray-100 rounded-lg mb-6"></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Metrics card */}
                    <div className="border rounded-lg p-6">
                        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="grid grid-cols-2 gap-4">
                            {Array.from({ length: 8 }, (_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chart placeholder */}
                    <div className="border rounded-lg p-6">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-64 bg-gray-100 rounded"></div>
                    </div>

                    {/* Positions table */}
                    <div className="border rounded-lg p-6">
                        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="space-y-3">
                            {Array.from({ length: 3 }, (_, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b">
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Mint form */}
                    <div className="border rounded-lg p-6">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="space-y-4">
                            <div className="h-10 bg-gray-200 rounded"></div>
                            <div className="space-y-2">
                                {Array.from({ length: 3 }, (_, i) => (
                                    <div key={i} className="flex justify-between">
                                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                    </div>

                    {/* Redeem form */}
                    <div className="border rounded-lg p-6">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="space-y-4">
                            <div className="h-10 bg-gray-200 rounded"></div>
                            <div className="space-y-2">
                                {Array.from({ length: 2 }, (_, i) => (
                                    <div key={i} className="flex justify-between">
                                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}