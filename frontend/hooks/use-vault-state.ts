'use client'

import { useQuery } from '@tanstack/react-query'
import { usePublicClient, useWatchContractEvent } from 'wagmi'
import { getContractAddress } from '../lib/config'
import { VAULT_ABI, ORACLE_ABI, TOKEN_ABI } from '../lib/abis'
import { VaultState } from '../types/vault'
import { Address } from 'viem'

/**
 * Hook to fetch single vault state with polling and real-time updates
 */
export function useVaultState(vaultAddress: Address) {
  const publicClient = usePublicClient()

  const {
    data: vault,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vault-state', vaultAddress],
    queryFn: async (): Promise<VaultState | null> => {
      if (!publicClient) throw new Error('Public client not available')

      try {
        console.log(`🔍 Individual vault: Fetching state for vault: ${vaultAddress}`)
        
        // Get vault basic info
        const [creator, tokenAddress, baseCap] = await Promise.all([
          publicClient.readContract({
            address: vaultAddress,
            abi: VAULT_ABI,
            functionName: 'creator',
          }),
          publicClient.readContract({
            address: vaultAddress,
            abi: VAULT_ABI,
            functionName: 'token',
          }),
          publicClient.readContract({
            address: vaultAddress,
            abi: VAULT_ABI,
            functionName: 'baseCap',
          }),
        ])

        // Get vault state
        const vaultState = await publicClient.readContract({
          address: vaultAddress,
          abi: VAULT_ABI,
          functionName: 'getVaultState',
        })

        // Get current aura
        const aura = await publicClient.readContract({
          address: getContractAddress('auraOracle'),
          abi: ORACLE_ABI,
          functionName: 'getAura',
          args: [vaultAddress],
        })

        // Get supply cap
        const supplyCap = await publicClient.readContract({
          address: vaultAddress,
          abi: VAULT_ABI,
          functionName: 'getCurrentSupplyCap',
        })

        // Get forced burn info
        const [pendingForcedBurn, forcedBurnDeadline] = await Promise.all([
          publicClient.readContract({
            address: vaultAddress,
            abi: VAULT_ABI,
            functionName: 'pendingForcedBurn',
          }),
          publicClient.readContract({
            address: vaultAddress,
            abi: VAULT_ABI,
            functionName: 'forcedBurnDeadline',
          }),
        ])

        // Get token metadata
        const [tokenName, tokenSymbol] = await Promise.all([
          publicClient.readContract({
            address: tokenAddress,
            abi: TOKEN_ABI,
            functionName: 'name',
          }),
          publicClient.readContract({
            address: tokenAddress,
            abi: TOKEN_ABI,
            functionName: 'symbol',
          }),
        ])

        return {
          address: vaultAddress,
          creator: creator as Address,
          token: tokenAddress as Address,
          creatorCollateral: vaultState[0],
          fanCollateral: vaultState[1],
          totalCollateral: vaultState[2],
          totalSupply: vaultState[3],
          peg: vaultState[4],
          stage: vaultState[5],
          health: vaultState[6],
          aura: Number(aura),
          baseCap,
          supplyCap,
          pendingForcedBurn,
          forcedBurnDeadline,
          tokenName,
          tokenSymbol,
        } as VaultState
      } catch (error) {
        console.error(`Failed to fetch vault state for ${vaultAddress}:`, error)
        return null
      }
    },
    enabled: !!vaultAddress && !!publicClient,
    refetchInterval: 10000, // Poll every 10 seconds
    staleTime: 5000,
  })

  // Watch for vault events that should trigger refetch
  useWatchContractEvent({
    address: vaultAddress,
    abi: VAULT_ABI,
    eventName: 'Minted',
    onLogs: () => {
      refetch()
    },
  })

  useWatchContractEvent({
    address: vaultAddress,
    abi: VAULT_ABI,
    eventName: 'Redeemed',
    onLogs: () => {
      refetch()
    },
  })

  useWatchContractEvent({
    address: vaultAddress,
    abi: VAULT_ABI,
    eventName: 'StageUnlocked',
    onLogs: () => {
      refetch()
    },
  })

  useWatchContractEvent({
    address: vaultAddress,
    abi: VAULT_ABI,
    eventName: 'LiquidationExecuted',
    onLogs: () => {
      refetch()
    },
  })

  useWatchContractEvent({
    address: vaultAddress,
    abi: VAULT_ABI,
    eventName: 'SupplyCapShrink',
    onLogs: () => {
      refetch()
    },
  })

  useWatchContractEvent({
    address: vaultAddress,
    abi: VAULT_ABI,
    eventName: 'ForcedBurnExecuted',
    onLogs: () => {
      refetch()
    },
  })

  // Watch for aura updates from oracle
  useWatchContractEvent({
    address: getContractAddress('auraOracle'),
    abi: ORACLE_ABI,
    eventName: 'AuraUpdated',
    args: {
      vault: vaultAddress,
    },
    onLogs: () => {
      refetch()
    },
  })

  return {
    vault,
    isLoading,
    error,
    refetch,
  }
}