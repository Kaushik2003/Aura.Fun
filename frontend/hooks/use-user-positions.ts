'use client'

import { useQuery } from '@tanstack/react-query'
import { usePublicClient, useWatchContractEvent } from 'wagmi'
import { VAULT_ABI } from '../lib/abis'
import { Position } from '../types/vault'
import { Address } from 'viem'

/**
 * Hook to fetch user positions with FIFO ordering
 * Fetches all positions for a user in a specific vault
 */
export function useUserPositions(vaultAddress: Address, userAddress?: Address) {
  const publicClient = usePublicClient()

  const {
    data: positions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-positions', vaultAddress, userAddress],
    queryFn: async (): Promise<Position[]> => {
      if (!publicClient || !userAddress) return []

      try {
        // Get position count for user
        const positionCount = await publicClient.readContract({
          address: vaultAddress,
          abi: VAULT_ABI,
          functionName: 'getPositionCount',
          args: [userAddress],
        })

        if (positionCount === BigInt(0)) return []

        // Fetch all positions
        const positionPromises = []
        for (let i = 0; i < Number(positionCount); i++) {
          positionPromises.push(
            publicClient.readContract({
              address: vaultAddress,
              abi: VAULT_ABI,
              functionName: 'getPosition',
              args: [userAddress, BigInt(i)],
            })
          )
        }

        const positionResults = await Promise.all(positionPromises)

        // Transform to Position objects and filter out redeemed positions (qty = 0)
        const positions: Position[] = positionResults
          .map((position, index) => ({
            owner: position.owner as Address,
            qty: position.qty,
            collateral: position.collateral,
            stage: position.stage,
            createdAt: position.createdAt,
            index,
          }))
          .filter(position => position.qty > BigInt(0)) // Filter out fully redeemed positions

        // Sort by creation time (FIFO order - oldest first)
        return positions.sort((a, b) => Number(a.createdAt - b.createdAt))
      } catch (error) {
        console.error(`Failed to fetch positions for ${userAddress} in vault ${vaultAddress}:`, error)
        return []
      }
    },
    enabled: !!vaultAddress && !!userAddress && !!publicClient,
    refetchInterval: 10000, // Poll every 10 seconds
    staleTime: 5000,
  })

  // Watch for mint events that create new positions
  useWatchContractEvent({
    address: vaultAddress,
    abi: VAULT_ABI,
    eventName: 'Minted',
    args: {
      minter: userAddress,
    },
    onLogs: () => {
      refetch()
    },
  })

  // Watch for redeem events that modify positions
  useWatchContractEvent({
    address: vaultAddress,
    abi: VAULT_ABI,
    eventName: 'Redeemed',
    args: {
      redeemer: userAddress,
    },
    onLogs: () => {
      refetch()
    },
  })

  return {
    positions: positions || [],
    isLoading,
    error,
    refetch,
  }
}