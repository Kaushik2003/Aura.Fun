import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { getConfig, NETWORK_CONFIGS } from './config'

// Get current network configuration
const config = getConfig()

// Define Anvil chain configuration
const anvilChain = {
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
    public: {
      http: ['http://localhost:8545'],
    },
  },
} as const

// Select chain based on environment
const chains = config.network === 'anvil' ? [anvilChain] : [sepolia]

// Create wagmi configuration with RainbowKit
export const wagmiConfig = getDefaultConfig({
  appName: 'AuraFi',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id',
  chains: chains as any,
  transports: {
    [config.chainId]: http(config.rpcUrl),
  },
})

// Export current chain for use in components
export const currentChain = chains[0]

// Helper to check if user is on correct network
export function isCorrectNetwork(chainId?: number): boolean {
  return chainId === config.chainId
}

// Hel