'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'
import { WalletConnect } from './wallet-connect'
import { useCreatorVaults } from '../../hooks/use-creator-vaults'
import { useAdminCheck } from '../../hooks/use-admin-check'
import { useEffect, useState } from 'react'

export function Navigation() {
    const pathname = usePathname()
    const { address } = useAccount()
    const { isCreator } = useCreatorVaults(address)
    const { isAdmin } = useAdminCheck(address)
    const [scrolled, setScrolled] = useState(false)
    const [visible, setVisible] = useState(true)
    const [lastScrollY, setLastScrollY] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            setScrolled(currentScrollY > 20)

            if (currentScrollY < lastScrollY || currentScrollY < 100) {
                setVisible(true)
            } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setVisible(false)
            }

            setLastScrollY(currentScrollY)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [lastScrollY])

    return (
        <nav className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-in-out ${visible ? 'top-4' : '-top-24'
            }`}>
            <div className={`transition-all duration-300 ${scrolled
                ? 'bg-black/90 backdrop-blur-2xl shadow-2xl shadow-black/50 border border-white/20'
                : 'bg-black/70 backdrop-blur-xl border border-white/10'
                } rounded-full px-6 py-3`}>
                <div className="flex items-center gap-6">
                    {/* Logo and Name */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                            <div className="relative h-9 w-9 rounded-full overflow-hidden shadow-xl shadow-cyan-500/30 ring-2 ring-cyan-400/20 group-hover:ring-cyan-400/40 transition-all">
                                <Image
                                    src="/logo.png"
                                    alt="AuraFun Logo"
                                    width={36}
                                    height={36}
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        </div>
                        <span className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                            AuraFun
                        </span>
                    </Link>

                    {/* Divider */}
                    <div className="h-8 w-px bg-white/20" />

                    {/* Navigation Links */}
                    <div className="flex items-center gap-2">
                        <Link
                            href="/vaults"
                            className={`px-4 py-2 rounded-full transition-all font-medium text-sm ${pathname.startsWith('/vaults') && !pathname.includes('/creator')
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            Browse Vaults
                        </Link>

                        {isCreator && (
                            <Link
                                href="/creator"
                                className={`px-4 py-2 rounded-full transition-all font-medium text-sm ${pathname.startsWith('/creator')
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                Creator Dashboard
                            </Link>
                        )}

                        <Link
                            href="/liquidate"
                            className={`px-4 py-2 rounded-full transition-all font-medium text-sm ${pathname === '/liquidate'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            Liquidate
                        </Link>

                        {isAdmin && (
                            <Link
                                href="/admin"
                                className={`px-4 py-2 rounded-full transition-all font-medium text-sm ${pathname === '/admin'
                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                Admin
                            </Link>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-8 w-px bg-white/20" />

                    {/* Wallet Connect */}
                    <WalletConnect />
                </div>
            </div>
        </nav>
    )
}
