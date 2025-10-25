'use client'

import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '../../lib/wagmi-config'
import '@rainbow-me/rainbowkit/styles.css'

// Create QueryClient with 10-second polling interval
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchInterval: 10000, // Poll every 10 seconds
            staleTime: 5000, // Data is fresh for 5 seconds
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
    },
})

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}