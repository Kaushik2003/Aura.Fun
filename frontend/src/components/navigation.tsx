'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'
import { WalletConnect } from './wallet-connect'
import { useCreatorVaults } from '../../hooks/use-creator-vaults'
import { useAdminCheck } from '../../hooks/use-admin-check'

export function Navigation() {
    const pathname = usePathname()
    const { address } = useAccount()
    const { isCreator } = useCreatorVaults(address)
    const { isAdmin } = useAdminCheck(address)

    return (
        <nav className="border-b border-gray-200 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-xl font-bold text-gray-900">
                            Aura.Farm
                        </Link>

                        <div className="flex gap-4">
                            <Link
                                href="/vaults"
                                className={`px-3 py-2 rounded-lg transition-colors ${pathname.startsWith('/vaults') && !pathname.includes('/creator')
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                Browse Vaults
                            </Link>

                            {isCreator && (
                                <Link
                                    href="/creator"
                                    className={`px-3 py-2 rounded-lg transition-colors ${pathname.startsWith('/creator')
                                        ? 'bg-purple-100 text-purple-600'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                >
                                    Creator Dashboard
                                </Link>
                            )}

                            <Link
                                href="/liquidate"
                                className={`px-3 py-2 rounded-lg transition-colors ${pathname === '/liquidate'
                                    ? 'bg-red-100 text-red-600'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                Liquidate
                            </Link>

                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    className={`px-3 py-2 rounded-lg transition-colors ${pathname === '/admin'
                                        ? 'bg-orange-100 text-orange-600'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                >
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>

                    <WalletConnect />
                </div>
            </div>
        </nav>
    )
}