/**
 * @file Treasury-related TypeScript interfaces and types
 * @description Type definitions for treasury events, stats, and admin operations
 */

import { Address } from 'viem'

/**
 * Represents a treasury event (fee collection or withdrawal)
 */
export interface TreasuryEvent {
  /** Event type */
  type: 'TreasuryCollected' | 'Withdrawn'
  /** Transaction hash */
  transactionHash: string
  /** Block number */
  blockNumber: bigint
  /** Timestamp */
  timestamp: bigint
  /** Amount in wei */
  amount: bigint
  /** Vault address (for TreasuryCollected) or recipient address (for Withdrawn) */
  address: Address
  /** Reason for collection (for TreasuryCollected) */
  reason?: string
}

/**
 * Treasury statistics and metrics
 */
export interface TreasuryStats {
  /** Current treasury balance in wei */
  currentBalance: bigint
  /** Total fees collected all time in wei */
  totalFeesCollected: bigint
  /** Total amount withdrawn all time in wei */
  totalWithdrawn: bigint
  /** Number of fee collection events */
  totalCollectionEvents: number
  /** Number of withdrawal events */
  totalWithdrawalEvents: number
  /** Average fee per collection in wei */
  averageFeePerCollection: bigint
  /** Last collection timestamp */
  lastCollectionTimestamp?: bigint
  /** Last withdrawal timestamp */
  lastWithdrawalTimestamp?: bigint
}

/**
 * Withdrawal form data
 */
export interface WithdrawalFormData {
  /** Recipient address */
  to: string
  /** Amount in CELO (will be converted to wei) */
  amount: string
}