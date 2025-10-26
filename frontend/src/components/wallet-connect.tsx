'use client'

import { useAccount, useBalance, useDisconnect, useSwitchChain } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useNetworkConfig } from '../../hooks/use-network-config'
import { useEffect, useState } from 'react'

export function WalletConnect() {
    const [mounted, setMounted] = useState(false)
    const { address, isConnected, chain } = useAccount()
    const { data: balance } = useBalance({
        address,
        query: {
            enabled: !!address,
        }
    })
    const { disconnect } = useDisconnect()
    const { switchChain } = useSwitchChain()
    const { targetChain, isWrongNetwork } = useNetworkConfig()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="flex items-center">
                <div className="px-4 py-2 bg-gray-100 rounded-lg animate-pulse">
                    <div className="w-20 h-4 bg-gray-300 rounded"></div>
                </div>
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div className="flex items-center">
                <ConnectButton />
            </div>
        )
    }

    return (
        <div className="flex items-center gap-4">
            {isWrongNetwork && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 px-4 py-2 rounded-lg backdrop-blur">
                    <p className="text-sm text-yellow-300 mb-1">
                        Wrong network: {chain?.name}. Please switch to {targetChain.name}
                    </p>
                    <button
                        onClick={() => switchChain({ chainId: targetChain.id })}
                        className="text-sm underline text-yellow-200 hover:text-yellow-100"
                    >
                        Switch Network
                    </button>
                </div>
            )}

            <div className="text-sm text-right">
                <p className="font-mono text-white font-medium">{formatAddress(address)}</p>
                <p className="text-emerald-400 font-semibold">
                    {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : 'Loading...'}
                </p>
            </div>

            <button
                onClick={() => disconnect()}
                className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20 hover:border-white/30 font-medium"
            >
                Disconnect
            </button>
        </div>
    )
}

function formatAddress(address?: string) {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}