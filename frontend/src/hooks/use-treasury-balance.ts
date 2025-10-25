/**
 * @file Treasury balance hook
 * @description Hook for fetching and monitoring treasury balance with real-time updates
 */

'use client'

import { useReadContract, useWatchContractEvent } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { TREASURY_ABI } from '@/lib/abis'
import { getContractAddress } from '@/lib/config'

/**
 * Hook to fetch treasury balance with real-time updates
 * @returns Treasury balance data and loading state
 */
export function useTreasuryBalance() {
  const queryClient = useQueryClient()
  const treasuryAddress = getContractAddress('treasury')

  // Fetch current balance
  const {
    data: balance,
    isLoading,
    error,
    refetch
  } = useReadContract({
    address: treasuryAddress,
    abi: TREASURY_ABI,
    functionName: 'getBalance',
    query: {
      refetchInterval: 10000, // Poll every 10 seconds
    }
  })

  // Watch for TreasuryCollected events to update balance
  useWatchContractEvent({
    address: treasuryAddress,
    abi: TREASURY_ABI,
    eventName: 'TreasuryCollected',
    onLogs: () => {
      // Invalidate and refetch balance when fees are collected
      queryClient.invalidateQueries({ 
        queryKey: ['readContract', { address: treasuryAddress, functionName: 'getBalance' }] 
      })
      refetch()
    }
  })

  // Watch for Withdrawn events to update balance
  useWatchContractEvent({
    address: treasuryAddress,
    abi: TREASURY_ABI,
    eventName: 'Withdrawn',
    onLogs: () => {
      // Invalidate and refetch balance when withdrawals occur
      queryClient.invalidateQueries({ 
        queryKey: ['readContract', { address: treasuryAddress, functionName: 'getBalance' }] 
      })
      refetch()
    }
  })

  return {
    balance: balance || 0n,
    isLoading,
    error,
    refetch
  }
}