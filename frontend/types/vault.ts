/**
 * @file Vault-related TypeScript interfaces and types
 * @description Type definitions for vault state, positions, and metrics used throughout the frontend
 */

import { Address } from 'viem'

/**
 * Represents the complete state of a CreatorVault
 * Returned by the getVaultState() contract function
 */
export interface VaultState {
  /** Address of the vault contract */
  address: Address
  /** Address of the creator who owns this vault */
  creator: Address
  /** Address of the associated CreatorToken contract */
  token: Address
  /** CELO staked by creator to unlock stages (in wei) */
  creatorCollateral: bigint
  /** CELO deposited by fans when minting (in wei) */
  fanCollateral: bigint
  /** Total CELO collateral (creator + fan) (in wei) */
  totalCollateral: bigint
  /** Total supply of tokens minted (in wei, 18 decimals) */
  totalSupply: bigint
  /** Current peg value (CELO per token, in wei) */
  peg: bigint
  /** Current stage (0 = not bootstrapped, 1+ = unlocked stages) */
  stage: number
  /** Current health ratio (collateralization ratio in wei, e.g., 1.5e18 = 150%) */
  health: bigint
  /** Current aura score (0-200) */
  aura: number
  /** Base capacity for supply cap calculation (in wei, 18 decimals) */
  baseCap: bigint
  /** Current supply cap based on aura (in wei, 18 decimals) */
  supplyCap: bigint
  /** Tokens pending forced burn after aura drop (in wei, 18 decimals) */
  pendingForcedBurn: bigint
  /** Deadline timestamp for forced burn execution (unix timestamp) */
  forcedBurnDeadline: bigint
  /** Token name (e.g., "Creator Token") */
  tokenName: string
  /** Token symbol (e.g., "CRTR") */
  tokenSymbol: string
}

/**
 * Represents a fan's minting position
 * Tracks individual mint transactions for FIFO redemption
 */
export interface Position {
  /** Address of the fan who minted */
  owner: Address
  /** Tokens minted in this position (in wei, 18 decimals) */
  qty: bigint
  /** CELO deposited (minus fees) (in wei) */
  collateral: bigint
  /** Stage at mint time */
  stage: number
  /** Timestamp of position creation (unix timestamp) */
  createdAt: bigint
  /** Index of this position in the user's positions array */
  index: number
}

/**
 * Aggregated metrics for vault analysis and display
 * Calculated from VaultState for UI convenience
 */
export interface VaultMetrics {
  /** Total Value Locked (totalCollateral in CELO) */
  tvl: number
  /** Health percentage (e.g., 150 for 150% collateralized) */
  healthPercentage: number
  /** Peg in CELO (e.g., 1.5 for 1.5 CELO per token) */
  pegInCelo: number
  /** Supply utilization percentage (totalSupply / supplyCap * 100) */
  supplyUtilization: number
  /** Stage capacity utilization percentage (totalSupply / stageCap * 100) */
  stageUtilization: number
  /** Whether vault is liquidatable (health < 120%) */
  isLiquidatable: boolean
  /** Whether vault is in forced burn state */
  hasForcedBurn: boolean
  /** Whether forced burn grace period has expired */
  forcedBurnExpired: boolean
  /** Time remaining in forced burn grace period (in seconds, 0 if expired) */
  forcedBurnTimeRemaining: number
}

/**
 * Configuration for each stage
 * Defines creator stake requirements and mint capacity per stage
 */
export interface StageConfig {
  /** Stage number (0-4) */
  stage: number
  /** Cumulative creator stake needed to unlock this stage (in wei) */
  stakeRequired: bigint
  /** Maximum tokens mintable at this stage (cumulative, in wei) */
  mintCap: bigint
}

/**
 * Vault creation parameters
 * Used when creating new vaults via VaultFactory
 */
export interface VaultCreationParams {
  /** Token name (e.g., "Creator Token") */
  name: string
  /** Token symbol (e.g., "CRTR") */
  symbol: string
  /** Address of the creator who will own the vault */
  creator: Address
  /** Base capacity for supply cap calculation (in wei, 18 decimals) */
  baseCap: bigint
}

/**
 * Vault creation result
 * Returned after successful vault deployment
 */
export interface VaultCreationResult {
  /** Address of the deployed CreatorVault */
  vaultAddress: Address
  /** Address of the deployed CreatorToken */
  tokenAddress: Address
  /** Transaction hash of the creation transaction */
  transactionHash: string
}

/**
 * Liquidation calculation result
 * Used to preview liquidation outcomes
 */
export interface LiquidationCalculation {
  /** CELO amount to inject for liquidation (in wei) */
  paymentAmount: bigint
  /** Tokens to be removed/burned (in wei, 18 decimals) */
  tokensToRemove: bigint
  /** Bounty for liquidator (1% of payment, in wei) */
  bounty: bigint
  /** Creator penalty (10% of creator collateral, capped at 20% of payment, in wei) */
  creatorPenalty: bigint
  /** Health ratio after liquidation (in wei, e.g., 1.5e18 = 150%) */
  healthAfter: bigint
  /** Whether liquidation is valid (health after >= 150%) */
  isValid: boolean
}

/**
 * Mint calculation result
 * Used to preview minting costs and requirements
 */
export interface MintCalculation {
  /** Quantity of tokens to mint (in wei, 18 decimals) */
  quantity: bigint
  /** Required collateral (qty * peg * 1.5, in wei) */
  requiredCollateral: bigint
  /** Mint fee (0.5% of required collateral, in wei) */
  mintFee: bigint
  /** Total cost (required collateral + fee, in wei) */
  totalCost: bigint
  /** Whether mint is valid (passes all validation checks) */
  isValid: boolean
  /** Error message if validation fails */
  errorMessage?: string
}

/**
 * Redemption calculation result
 * Used to preview redemption returns using FIFO logic
 */
export interface RedemptionCalculation {
  /** Quantity of tokens to redeem (in wei, 18 decimals) */
  quantity: bigint
  /** Estimated CELO return based on FIFO positions (in wei) */
  estimatedReturn: bigint
  /** Positions that will be affected by redemption */
  affectedPositions: Position[]
  /** Health ratio after redemption (in wei, e.g., 1.5e18 = 150%) */
  healthAfter: bigint
  /** Whether redemption is valid (health after >= 150%) */
  isValid: boolean
  /** Error message if validation fails */
  errorMessage?: string
}

/**
 * Vault filter options for discovery page
 * Used to filter and sort vault listings
 */
export interface VaultFilters {
  /** Filter by creator address (partial match) */
  creator?: string
  /** Minimum health percentage */
  healthMin?: number
  /** Maximum health percentage */
  healthMax?: number
  /** Filter by specific stage */
  stage?: number | null
  /** Minimum TVL in CELO */
  tvlMin?: number
  /** Maximum TVL in CELO */
  tvlMax?: number
  /** Minimum aura score */
  auraMin?: number
  /** Maximum aura score */
  auraMax?: number
}

/**
 * Vault sorting options
 * Used to sort vault listings
 */
export interface VaultSortOptions {
  /** Field to sort by */
  sortBy: 'tvl' | 'aura' | 'health' | 'stage' | 'createdAt'
  /** Sort order */
  sortOrder: 'asc' | 'desc'
}

/**
 * Extended vault information for display
 * Combines VaultState with calculated metrics and metadata
 */
export interface VaultDisplayInfo extends VaultState {
  /** Calculated metrics for UI display */
  metrics: VaultMetrics
  /** User's token balance in this vault (in wei, 18 decimals) */
  userBalance?: bigint
  /** User's positions in this vault */
  userPositions?: Position[]
  /** Whether current user is the creator of this vault */
  isUserCreator?: boolean
}

/**
 * Vault event data for real-time updates
 * Represents events emitted by vault contracts
 */
export interface VaultEvent {
  /** Event name */
  eventName: 'Minted' | 'Redeemed' | 'StageUnlocked' | 'LiquidationExecuted' | 'SupplyCapShrink' | 'ForcedBurnExecuted'
  /** Vault address that emitted the event */
  vaultAddress: Address
  /** Block number where event occurred */
  blockNumber: bigint
  /** Transaction hash */
  transactionHash: string
  /** Event-specific data */
  data: Record<string, any>
  /** Timestamp when event occurred */
  timestamp: bigint
}

/**
 * Constants for vault calculations and validation
 */
export const VAULT_CONSTANTS = {
  /** WAD precision constant (1e18) */
  WAD: BigInt('1000000000000000000'),
  /** Minimum collateralization ratio (150%) */
  MIN_CR: BigInt('1500000000000000000'),
  /** Liquidation threshold (120%) */
  LIQ_CR: BigInt('1200000000000000000'),
  /** Mint fee (0.5%) */
  MINT_FEE: BigInt('5000000000000000'),
  /** Liquidation bounty (1%) */
  LIQUIDATION_BOUNTY: BigInt('10000000000000000'),
  /** Forced burn grace period (24 hours in seconds) */
  FORCED_BURN_GRACE: 24 * 60 * 60,
  /** Oracle update cooldown (6 hours in seconds) */
  ORACLE_UPDATE_COOLDOWN: 6 * 60 * 60,
  /** Minimum peg (0.3 CELO) */
  P_MIN: BigInt('300000000000000000'),
  /** Maximum peg (3.0 CELO) */
  P_MAX: BigInt('3000000000000000000'),
  /** Reference aura value */
  A_REF: 100,
  /** Minimum aura */
  A_MIN: 0,
  /** Maximum aura */
  A_MAX: 200
} as const