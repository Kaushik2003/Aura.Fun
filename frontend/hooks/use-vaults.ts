'use client'

import { useQuery } from '@tanstack/react-query'
import { usePublicClient, useWatchContractEvent } from 'wagmi'
import { getContractAddress } from '../lib/config'
import { FACTORY_ABI, VAULT_ABI, ORACLE_ABI, TOKEN_ABI } from '../lib/abis'
import { VaultState } from '../types/vault'
// No additional imports needed

/**
 * Hook to fetch all vaults from VaultFactory
 * Fetches VaultCreated events and enriches with current vault state
 */
export function useVaults() {
  const publicClient = usePublicClient()

  const {
    data: vaults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vaults'],
    queryFn: async (): Promise<VaultState[]> => {
      if (!publicClient) throw new Error('Public client not available')

      console.log('Fetching vaults from factory:', getContractAddress('vaultFactory'))
      
      // Fetch all VaultCreated events using the FACTORY_ABI
      const vaultCreatedEvents = await publicClient.getContractEvents({
        address: getContractAddress('vaultFactory'),
        abi: FACTORY_ABI,
        eventName: 'VaultCreated',
        fromBlock: 'earliest',
        toBlock: 'latest',
      })

      console.log('Found vault events:', vaultCreatedEvents.length)

      // Fetch current state for each vault
      const vaultStates = await Promise.all(
        vaultCreatedEvents.map(async (event) => {
          const vaultAddress = event.args.vault as `0x${string}`
          const creator = event.args.creator as `0x${string}`
          const tokenAddress = event.args.token as `0x${string}`
          const baseCap = event.args.baseCap as bigint

          try {
            console.log(`🔍 Fetching state for vault: ${vaultAddress}`)
            
            // Get vault state
            const vaultState = await publicClient.readContract({
              address: vaultAddress,
              abi: VAULT_ABI,
              functionName: 'getVaultState',
            })
            
            console.log(`✅ Got vault state for ${vaultAddress}:`, vaultState)

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
            const pendingForcedBurn = await publicClient.readContract({
              address: vaultAddress,
              abi: VAULT_ABI,
              functionName: 'pendingForcedBurn',
            })

            const forcedBurnDeadline = await publicClient.readContract({
              address: vaultAddress,
              abi: VAULT_ABI,
              functionName: 'forcedBurnDeadline',
            })

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

            const vault = {
              address: vaultAddress,
              creator,
              token: tokenAddress,
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
            
            console.log(`🎉 Successfully created vault state for ${vaultAddress}:`, vault)
            return vault
          } catch (error) {
            console.error(`Failed to fetch state for vault ${vaultAddress}:`, error)
            return null
          }
        })
      )

      // Filter out failed fetches
      const validVaults = vaultStates.filter((vault): vault is VaultState => vault !== null)
      console.log(`📊 Final vault count: ${validVaults.length}`, validVaults)
      return validVaults
    },
    refetchInterval: 10000, // Poll every 10 seconds
    staleTime: 5000,
  })

  // Watch for new vault creation events
  useWatchContractEvent({
    address: getContractAddress('vaultFactory'),
    abi: FACTORY_ABI,
    eventName: 'VaultCreated',
    onLogs: () => {
      refetch()
    },
  })

  return {
    vaults: vaults || [],
    isLoading,
    error,
    refetch,
  }
}