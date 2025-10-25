/**
 * @file Treasury events hook
 * @description Hook for fetching all treasury events (collections and withdrawals)
 */

'use client'

import { useEffect, useState } from 'react'
import { usePublicClient, useWatchContractEvent } from 'wagmi'
import { TREASURY_ABI } from '@/lib/abis'
import { getContractAddress } from '@/lib/config'
import { TreasuryEvent, TreasuryStats } from '@/types/treasury'
import { Address } from 'viem'

/**
 * Hook to fetch all treasury events and calculate statistics
 * @returns Treasury events, stats, and loading state
 */
export function useTreasuryEvents() {
  const [events, setEvents] = useState<TreasuryEvent[]>([])
  const [stats, setStats] = useState<TreasuryStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const publicClient = usePublicClient()
  const treasuryAddress = getContractAddress('treasury')

  // Fetch historical events
  useEffect(() => {
    async function fetchEvents() {
      if (!publicClient) return

      try {
        setIsLoading(true)
        setError(null)

        // Get current block number
        const currentBlock = await publicClient.getBlockNumber()
        
        // Fetch from deployment block (or last 10000 blocks if unknown)
        const fromBlock = currentBlock - 10000n

        // Fetch TreasuryCollected events
        const collectedLogs = await publicClient.getLogs({
          address: treasuryAddress,
          event: {
            type: 'event',
            name: 'TreasuryCollected',
            inputs: [
              { name: 'vault', type: 'address', indexed: true },
              { name: 'amount', type: 'uint256', indexed: false },
              { name: 'reason', type: 'string', indexed: false }
            ]
          },
          fromBlock,
          toBlock: 'latest'
        })

        // Fetch Withdrawn events
        const withdrawnLogs = await publicClient.getLogs({
          address: treasuryAddress,
          event: {
            type: 'event',
            name: 'Withdrawn',
            inputs: [
              { name: 'to', type: 'address', indexed: true },
              { name: 'amount', type: 'uint256', indexed: false }
            ]
          },
          fromBlock,
          toBlock: 'latest'
        })

        // Get block timestamps for all events
        const allLogs = [...collectedLogs, ...withdrawnLogs]
        const blocks = await Promise.all(
          allLogs.map(log => publicClient.getBlock({ blockNumber: log.blockNumber }))
        )

        // Process TreasuryCollected events
        const collectedEvents: TreasuryEvent[] = collectedLogs.map((log, index) => {
          const blockIndex = allLogs.findIndex(l => l.blockNumber === log.blockNumber && l.logIndex === log.logIndex)
          return {
            type: 'TreasuryCollected',
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
            timestamp: blocks[blockIndex].timestamp,
            amount: log.args.amount as bigint,
            address: log.args.vault as Address,
            reason: log.args.reason as string
          }
        })

        // Process Withdrawn events
        const withdrawnEvents: TreasuryEvent[] = withdrawnLogs.map((log, index) => {
          const blockIndex = allLogs.findIndex(l => l.blockNumber === log.blockNumber && l.logIndex === log.logIndex)
          return {
            type: 'Withdrawn',
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
            timestamp: blocks[blockIndex].timestamp,
            amount: log.args.amount as bigint,
            address: log.args.to as Address
          }
        })

        // Combine and sort events by timestamp (newest first)
        const allEvents = [...collectedEvents, ...withdrawnEvents]
          .sort((a, b) => Number(b.timestamp - a.timestamp))

        setEvents(allEvents)

        // Calculate statistics
        const totalFeesCollected = collectedEvents.reduce((sum, event) => sum + event.amount, 0n)
        const totalWithdrawn = withdrawnEvents.reduce((sum, event) => sum + event.amount, 0n)
        const totalCollectionEvents = collectedEvents.length
        const totalWithdrawalEvents = withdrawnEvents.length
        
        const averageFeePerCollection = totalCollectionEvents > 0 
          ? totalFeesCollected / BigInt(totalCollectionEvents)
          : 0n

        const lastCollectionTimestamp = collectedEvents.length > 0 
          ? collectedEvents.sort((a, b) => Number(b.timestamp - a.timestamp))[0].timestamp
          : undefined

        const lastWithdrawalTimestamp = withdrawnEvents.length > 0
          ? withdrawnEvents.sort((a, b) => Number(b.timestamp - a.timestamp))[0].timestamp
          : undefined

        const calculatedStats: TreasuryStats = {
          currentBalance: 0n, // Will be updated by useTreasuryBalance
          totalFeesCollected,
          totalWithdrawn,
          totalCollectionEvents,
          totalWithdrawalEvents,
          averageFeePerCollection,
          lastCollectionTimestamp,
          lastWithdrawalTimestamp
        }

        setStats(calculatedStats)
      } catch (err) {
        console.error('Error fetching treasury events:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [publicClient, treasuryAddress])

  // Watch for new TreasuryCollected events
  useWatchContractEvent({
    address: treasuryAddress,
    abi: TREASURY_ABI,
    eventName: 'TreasuryCollected',
    onLogs: async (logs) => {
      if (!publicClient) return

      for (const log of logs) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
        const newEvent: TreasuryEvent = {
          type: 'TreasuryCollected',
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          timestamp: block.timestamp,
          amount: log.args.amount as bigint,
          address: log.args.vault as Address,
          reason: log.args.reason as string
        }

        setEvents(prev => [newEvent, ...prev])
        
        // Update stats
        setStats(prev => prev ? {
          ...prev,
          totalFeesCollected: prev.totalFeesCollected + newEvent.amount,
          totalCollectionEvents: prev.totalCollectionEvents + 1,
          averageFeePerCollection: prev.totalCollectionEvents > 0 
            ? (prev.totalFeesCollected + newEvent.amount) / BigInt(prev.totalCollectionEvents + 1)
            : newEvent.amount,
          lastCollectionTimestamp: newEvent.timestamp
        } : null)
      }
    }
  })

  // Watch for new Withdrawn events
  useWatchContractEvent({
    address: treasuryAddress,
    abi: TREASURY_ABI,
    eventName: 'Withdrawn',
    onLogs: async (logs) => {
      if (!publicClient) return

      for (const log of logs) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
        const newEvent: TreasuryEvent = {
          type: 'Withdrawn',
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          timestamp: block.timestamp,
          amount: log.args.amount as bigint,
          address: log.args.to as Address
        }

        setEvents(prev => [newEvent, ...prev])
        
        // Update stats
        setStats(prev => prev ? {
          ...prev,
          totalWithdrawn: prev.totalWithdrawn + newEvent.amount,
          totalWithdrawalEvents: prev.totalWithdrawalEvents + 1,
          lastWithdrawalTimestamp: newEvent.timestamp
        } : null)
      }
    }
  })

  return {
    events,
    stats,
    isLoading,
    error,
    refetch: () => {
      // Trigger re-fetch by updating a dependency
      setIsLoading(true)
    }
  }
}