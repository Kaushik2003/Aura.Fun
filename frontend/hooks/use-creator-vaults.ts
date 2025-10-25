'use client'

import { useQuery } from '@tanstack/react-query'
import { usePublicClient, useWatchContractEvent } from 'wagmi'
import { getContractAddress } from '../lib/config'
import { FACTORY_ABI, VAULT_ABI, ORACLE_ABI, TOKEN_ABI } from '../lib/abis'
import { VaultState } from '../types/vault'
import { Address, parseAbiItem } from 'viem'

/**
 * Hook to filter vaults by creator and provide creator-specific metrics
 */
export function useCreatorVaults(creatorAddress?: Address) {
  const publicClient = usePublicClient()

  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['creator-vaults', creatorAddress],
    queryFn: async () => {
      if (!publicClient || !creatorAddress) {
        return { vaults: [], isCreator: false, stats: null }
      }

      try {
        // Fetch all VaultCreated events for this creator
        const vaultCreatedEvents = await publicClient.getLogs({
          address: getContractAddress('vaultFactory'),
          event: parseAbiItem('event VaultCreated(address indexed creator, address vault, address token, uint256 baseCap)'),
          args: {
            creator: creatorAddress,
          },
          fromBlock: 'earliest',
          toBlock: 'latest',
        })

        if (vaultCreatedEvents.length === 0) {
          return { vaults: [], isCreator: false, stats: null }
        }

        // Fetch current state for each vault
        const vaultStates = await Promise.all(
          vaultCreatedEvents.map(async (event) => {
            const vaultAddress = event.args.vault as Address
            const tokenAddress = event.args.token as Address
            const baseCap = event.args.baseCap as bigint

            try {
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
                creator: creatorAddress,
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
            } catch (error) {
              console.error(`Failed to fetch state for vault ${vaultAddress}:`, error)
              return null
            }
          })
        )

        // Filter out failed fetches
        const vaults = vaultStates.filter((vault): vault is VaultState => vault !== null)

        // Calculate aggregate stats
        const stats = vaults.length > 0 ? {
          totalVaults: vaults.length,
          totalCreatorCollateral: vaults.reduce((sum, v) => sum + v.creatorCollateral, BigInt(0)),
          totalFanCollateral: vaults.reduce((sum, v) => sum + v.fanCollateral, BigInt(0)),
          totalTVL: vaults.reduce((sum, v) => sum + v.totalCollateral, BigInt(0)),
          totalSupply: vaults.reduce((sum, v) => sum + v.totalSupply, BigInt(0)),
          averageAura: Math.round(vaults.reduce((sum, v) => sum + v.aura, 0) / vaults.length),
          averageHealth: vaults.reduce((sum, v) => sum + Number(v.health), 0) / vaults.length / 1e18 * 100,
          activeVaults: vaults.filter(v => v.stage > 0).length,
          liquidatableVaults: vaults.filter(v => Number(v.health) < 1.2e18).length,
        } : null

        return {
          vaults,
          isCreator: vaults.length > 0,
          stats,
        }
      } catch (error) {
        console.error(`Failed to fetch creator vaults for ${creatorAddress}:`, error)
        return { vaults: [], isCreator: false, stats: null }
      }
    },
    enabled: !!creatorAddress && !!publicClient,
    refetchInterval: 10000, // Poll every 10 seconds
    staleTime: 5000,
  })

  // Watch for new vault creation events by this creator
  useWatchContractEvent({
    address: getContractAddress('vaultFactory'),
    abi: FACTORY_ABI,
    eventName: 'VaultCreated',
    args: {
      creator: creatorAddress,
    },
    onLogs: () => {
      refetch()
    },
  })

  // Watch for vault events that affect creator metrics
  // Note: We can't watch all vaults at once, so we rely on polling for updates
  // Individual vault pages will have their own event watchers

  return {
    vaults: result?.vaults || [],
    isCreator: result?.isCreator || false,
    stats: result?.stats,
    isLoading,
    error,
    refetch,
  }
}