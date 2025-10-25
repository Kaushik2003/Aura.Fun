/**
 * Hook for network configuration and detection
 */

import { useAccount, useChainId } from 'wagmi'
import { useMemo } from 'react'
import { formatAddress, isValidAddress, formatTxHash, isValidTxHash } from '../lib/utils'

// Network configuration based on environment
const NETWORK_CONFIG = {
  anvil: {
    id: 31337,
    name: 'Anvil Local',
    rpcUrl: 'http://localhost:8545',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorers: {
      default: {
        name: 'Local Explorer',
        url: 'http://localhost:8545',
      },
    },
  },
  sepolia: {
    id: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18,
    },
    blockExplorers: {
      default: {
        name: 'Etherscan',
        url: 'https://sepolia.etherscan.io',
      },
    },
  },
} as const

type NetworkType = keyof typeof NETWORK_CONFIG

/**
 * Hook to get current network configuration and detect network mismatches
 */
export function useNetworkConfig() {
  const chainId = useChainId()
  const { isConnected } = useAccount()

  // Get target network from environment
  const targetNetworkType = (process.env.NEXT_PUBLIC_NETWORK as NetworkType) || 'anvil'
  const targetChain = NETWORK_CONFIG[targetNetworkType]

  // Determine current network type based on chain ID
  const currentNetworkType = useMemo((): NetworkType | null => {
    if (chainId === NETWORK_CONFIG.anvil.id) return 'anvil'
    if (chainId === NETWORK_CONFIG.sepolia.id) return 'sepolia'
    return null
  }, [chainId])

  const currentChain = currentNetworkType ? NETWORK_CONFIG[currentNetworkType] : null

  // Check if user is on wrong network
  const isWrongNetwork = useMemo(() => {
    if (!isConnected) return false
    return chainId !== targetChain.id
  }, [isConnected, chainId, targetChain.id])

  // Check if current network is supported
  const isSupportedNetwork = useMemo(() => {
    return currentNetworkType !== null
  }, [currentNetworkType])

  // Get network display information
  const networkInfo = useMemo(() => {
    return {
      target: {
        type: targetNetworkType,
        name: targetChain.name,
        chainId: targetChain.id,
      },
      current: currentChain ? {
        type: currentNetworkType!,
        name: currentChain.name,
        chainId: currentChain.id,
      } : null,
    }
  }, [targetNetworkType, targetChain, currentChain, currentNetworkType])

  // Get contract addresses for current environment
  const contractAddresses = useMemo(() => {
    const prefix = targetNetworkType.toUpperCase()
    
    return {
      vaultFactory: process.env[`NEXT_PUBLIC_${prefix}_VAULT_FACTORY_ADDRESS`] || '',
      auraOracle: process.env[`NEXT_PUBLIC_${prefix}_AURA_ORACLE_ADDRESS`] || '',
      treasury: process.env[`NEXT_PUBLIC_${prefix}_TREASURY_ADDRESS`] || '',
    }
  }, [targetNetworkType])

  // Validate contract addresses
  const hasValidAddresses = useMemo(() => {
    const { vaultFactory, auraOracle, treasury } = contractAddresses
    
    return (
      vaultFactory && vaultFactory !== '0x0000000000000000000000000000000000000000' &&
      auraOracle && auraOracle !== '0x0000000000000000000000000000000000000000' &&
      treasury && treasury !== '0x0000000000000000000000000000000000000000'
    )
  }, [contractAddresses])

  return {
    // Network configuration
    targetChain,
    currentChain,
    targetNetworkType,
    currentNetworkType,
    
    // Network status
    isWrongNetwork,
    isSupportedNetwork,
    isConnected,
    
    // Network information
    networkInfo,
    
    // Contract addresses
    contractAddresses,
    hasValidAddresses,
    
    // Utility functions
    getBlockExplorerUrl: (hash: string, type: 'tx' | 'address' = 'tx') => {
      const baseUrl = currentChain?.blockExplorers.default.url || targetChain.blockExplorers.default.url
      return `${baseUrl}/${type}/${hash}`
    },
    
    isTargetNetwork: (networkType: NetworkType) => {
      return targetNetworkType === networkType
    },
    
    isCurrentNetwork: (networkType: NetworkType) => {
      return currentNetworkType === networkType
    },
  }
}

/**
 * Hook to get a specific contract address
 */
export function useContractAddress(contractName: 'vaultFactory' | 'auraOracle' | 'treasury') {
  const { contractAddresses } = useNetworkConfig()
  return contractAddresses[contractName]
}

/**
 * Utility function to get contract address (for use outside hooks)
 */
export function getContractAddress(contractName: 'VAULT_FACTORY' | 'AURA_ORACLE' | 'TREASURY'): string {
  const networkType = (process.env.NEXT_PUBLIC_NETWORK as NetworkType) || 'anvil'
  const prefix = networkType.toUpperCase()
  
  const envVarName = `NEXT_PUBLIC_${prefix}_${contractName}_ADDRESS`
  const address = process.env[envVarName] || ''
  
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    console.warn(`Contract address not configured: ${envVarName}`)
    return ''
  }
  
  return address
}



/**
 * Get network-specific configuration
 */
export function getNetworkConfig(networkType?: NetworkType) {
  const type = networkType || (process.env.NEXT_PUBLIC_NETWORK as NetworkType) || 'anvil'
  return NETWORK_CONFIG[type]
}