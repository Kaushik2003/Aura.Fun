# AuraFi Frontend Development Game Plan

## Executive Summary

This document provides a comprehensive roadmap for building a Next.js frontend that interacts with the deployed AuraFi smart contracts on Celo Alfajores testnet. The frontend will enable creators to manage vaults and fans to mint/redeem tokens.

## 1. Protocol Flow Analysis

### 1.1 Core User Journeys

**Creator Journey:**
1. **Connect Wallet** → Connect as creator account
2. **Create Vault** → Call VaultFactory.createVault() with token name, symbol, and base capacity
3. **Bootstrap Stake** → Deposit 100 CELO to unlock Stage 1 (enables fan minting)
4. **Stage Progression** → Deposit more CELO to unlock higher stages (Stage 2: 300 CELO total, Stage 3: 800 CELO, Stage 4: 1800 CELO)
5. **Monitor Health** → Track vault collateralization, aura updates, and supply cap
6. **Respond to Events** → React to forced burns or liquidations (avoid penalties)

**Fan Journey:**
1. **Discover Vaults** → Browse creator vaults (created by creators, not protocol)
2. **Check Peg** → View current token price based on creator's aura
3. **Mint Tokens** → Deposit CELO at 150% collateralization to mint creator tokens
4. **Hold & Monitor** → Track position value, vault health, and aura changes
5. **Redeem Tokens** → Burn tokens to recover CELO (FIFO order from positions)
6. **Manage Risk** → Exit during grace periods before forced burns

**Liquidator Journey:**
1. **Monitor Vaults** → Scan all vaults for health < 120%
2. **Execute Liquidation** → Inject CELO to restore health to 150%
3. **Earn Rewards** → Receive 1% bounty + creator penalty (10% of creator stake, capped at 20% of payment)

**Oracle Role (Automated - Not a User Journey):**
1. Fetch Farcaster metrics for creators
2. Compute aura score (0-200)
3. Push aura + IPFS evidence to AuraOracle contract
4. Repeat every 6+ hours per vault

### 1.2 Contract Relationships & Data Flow

```
┌─────────────┐
│VaultFactory │ ──creates──> ┌──────────────┐
└─────────────┘               │CreatorVault  │
                              └──────────────┘
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                    │
          ┌─────▼──────┐      ┌─────▼──────┐      ┌─────▼──────┐
          │CreatorToken│      │AuraOracle  │      │ Treasury   │
          └────────────┘      └────────────┘      └────────────┘
```


**Key Data Dependencies:**

- **VaultFactory** → Registry of all creator vaults (creators call createVault() to deploy their own)
- **CreatorVault** → Core state (collateral, supply, stage, positions) - one per creator
- **AuraOracle** → Shared oracle storing aura for all vaults (drives peg & supply cap)
- **CreatorToken** → ERC20 token (one per vault, vault-restricted mint/burn)
- **Treasury** → Fee collection (passive, no UI needed)

**Critical Read Operations:**
- `getVaultState()` → Returns all vault metrics in one call
- `getCurrentAura()` → Fetches aura from oracle
- `getPeg()` → Calculates current CELO/token price
- `getCurrentSupplyCap()` → Max allowed supply based on aura
- `getPosition(owner, index)` → Individual position details
- `getPositionCount(owner)` → Number of positions for a fan

**Critical Write Operations (By Role):**

*Creator Operations:*
- `createVault(name, symbol, creator, baseCap)` → Creator calls Factory to deploy their vault
- `bootstrapCreatorStake()` → Creator deposits 100 CELO to unlock Stage 1
- `unlockStage()` → Creator deposits more CELO to unlock next stage

*Fan Operations:*
- `mintTokens(qty)` → Fan deposits CELO at 150% collateralization to mint tokens
- `redeemTokens(qty)` → Fan burns tokens to recover CELO (FIFO from positions)

*Permissionless Operations (Anyone):*
- `checkAndTriggerForcedBurn()` → Anyone can trigger when supply > cap
- `executeForcedBurn(maxOwners)` → Anyone can execute after 24h grace period
- `liquidate()` → Anyone can liquidate when health < 120%, earn bounty

*Oracle Operations (Automated):*
- `pushAura(vault, aura, ipfsHash)` → Oracle updates aura every 6+ hours

### 1.3 Economic Mechanics

**Peg Calculation:**
- Formula: `P(aura) = BASE_PRICE * (1 + K * (aura/A_REF - 1))`
- Aura range: 0-200, Reference: 100
- Peg range: 0.3 CELO (min) to 3.0 CELO (max)
- Sensitivity K = 0.5

**Supply Cap:**
- Formula: `SupplyCap = BaseCap * (1 + 0.75 * (aura - 100) / 100)`
- Clamped: [BaseCap * 0.25, BaseCap * 4]

**Health Ratio:**
- Formula: `Health = totalCollateral / (totalSupply * peg)`
- MIN_CR = 150% (required for minting)
- LIQ_CR = 120% (liquidation threshold)

**Collateral Requirements:**
- Mint: `qty * peg * 1.5 + 0.5% fee`
- Redeem: Proportional from FIFO positions

## 2. Proposed Next.js Project Structure


```
aurafi-frontend/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing page
│   ├── vaults/
│   │   ├── page.tsx            # Vault discovery/list
│   │   └── [address]/
│   │       ├── page.tsx        # Vault detail page
│   │       └── manage/
│   │           └── page.tsx    # Creator management
│   ├── create/
│   │   └── page.tsx            # Create new vault
│   └── liquidate/
│       └── page.tsx            # Liquidator dashboard
│
├── components/
│   ├── vault/
│   │   ├── VaultCard.tsx       # Vault summary card
│   │   ├── VaultStats.tsx      # Metrics display
│   │   ├── VaultHealth.tsx     # Health indicator
│   │   ├── AuraDisplay.tsx     # Aura score + peg
│   │   ├── StageProgress.tsx   # Stage unlock UI
│   │   └── PositionList.tsx    # User positions
│   ├── actions/
│   │   ├── MintForm.tsx        # Fan minting interface
│   │   ├── RedeemForm.tsx      # Redemption interface
│   │   ├── StakeForm.tsx       # Creator staking
│   │   └── LiquidateForm.tsx   # Liquidation interface
│   ├── wallet/
│   │   ├── ConnectButton.tsx   # Wallet connection
│   │   └── NetworkSwitch.tsx   # Celo network selector
│   └── ui/
│       ├── Button.tsx          # Reusable button
│       ├── Card.tsx            # Card component
│       ├── Input.tsx           # Form input
│       └── Badge.tsx           # Status badges
│
├── lib/
│   ├── contracts/
│   │   ├── abis/               # Contract ABIs
│   │   │   ├── VaultFactory.json
│   │   │   ├── CreatorVault.json
│   │   │   ├── AuraOracle.json
│   │   │   └── CreatorToken.json
│   │   ├── addresses.ts        # Deployed addresses
│   │   └── config.ts           # Contract constants
│   ├── hooks/
│   │   ├── useVault.ts         # Vault data hook
│   │   ├── useVaultList.ts     # All vaults hook
│   │   ├── usePositions.ts     # User positions hook
│   │   ├── useAura.ts          # Aura data hook
│   │   └── useTransactions.ts  # TX state management
│   ├── utils/
│   │   ├── calculations.ts     # Peg, health, supply cap
│   │   ├── formatting.ts       # Number/address formatting
│   │   └── validation.ts       # Input validation
│   └── wagmi.ts                # Wagmi configuration
│
├── public/
│   └── assets/                 # Images, icons
│
├── styles/
│   └── globals.css             # Tailwind + custom styles
│
├── .env.local                  # Environment variables
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```


## 3. Core Components Breakdown

### 3.1 Wallet Integration Components

**ConnectButton.tsx**
- Uses RainbowKit or ConnectKit for wallet connection
- Displays connected address (truncated)
- Shows CELO balance
- Network switcher (Alfajores testnet)

**NetworkSwitch.tsx**
- Detects current network
- Prompts switch to Celo Alfajores if wrong network
- Shows network status indicator

### 3.2 Vault Discovery Components

**VaultList.tsx**
- Fetches all vaults from factory events
- Displays grid of VaultCard components
- Filters: by creator, by health, by stage
- Sorting: by TVL, by aura, by health

**VaultCard.tsx**
- Creator info (address, maybe ENS/Farcaster name)
- Current aura score + peg
- TVL (total collateral)
- Health ratio with color coding
- Stage indicator
- "View Details" CTA

### 3.3 Vault Detail Components

**VaultStats.tsx**
- Creator collateral
- Fan collateral
- Total supply
- Current peg
- Health ratio
- Stage (with progress to next)
- Supply cap utilization

**AuraDisplay.tsx**
- Large aura score (0-200)
- Visual gauge/chart
- Current peg derived from aura
- Last update timestamp
- Link to IPFS evidence

**StageProgress.tsx**
- Current stage indicator (0-4)
- Requirements for next stage
- Progress bar (creator collateral vs required)
- Unlock button (for creators)

**PositionList.tsx**
- Table of user's positions
- Columns: qty, collateral, stage, created date
- Total position value
- Redeem button per position or bulk

### 3.4 Action Components

**MintForm.tsx**
- Input: quantity to mint
- Calculates required CELO (qty * peg * 1.5 + fee)
- Shows: peg, fee, total cost
- Validates: stage > 0, supply cap, stage cap
- Approve + Mint flow
- Transaction status

**RedeemForm.tsx**
- Input: quantity to redeem
- Shows: estimated CELO return (from FIFO positions)
- Validates: sufficient balance, health check
- Burn + Redeem flow
- Transaction status

**StakeForm.tsx** (Creator only)
- Bootstrap mode: initial stake for stage 1
- Unlock mode: additional stake for next stage
- Shows: current stage, next stage requirements
- Input: CELO amount
- Transaction status

**LiquidateForm.tsx**
- Shows: current health, tokens to remove
- Input: CELO to inject
- Calculates: bounty, health after
- Validates: health < 120%
- Transaction status


## 4. Web3 Integration Strategy

### 4.1 Tech Stack

**Core Libraries:**
- **wagmi** (v2) - React hooks for Ethereum
- **viem** - TypeScript Ethereum library
- **RainbowKit** or **ConnectKit** - Wallet connection UI
- **TanStack Query** - Data fetching & caching

**Why this stack:**
- wagmi provides type-safe contract interactions
- viem is lightweight and modern (vs ethers.js)
- RainbowKit has excellent UX for wallet connection
- TanStack Query handles caching and refetching

### 4.2 Wagmi Configuration

```typescript
// lib/wagmi.ts
import { createConfig, http } from 'wagmi'
import { celoAlfajores } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const config = getDefaultConfig({
  appName: 'AuraFi',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [celoAlfajores],
  transports: {
    [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org'),
  },
})
```

### 4.3 Contract Interaction Patterns

**Reading Data:**
```typescript
// lib/hooks/useVault.ts
import { useReadContract } from 'wagmi'
import { VAULT_ABI } from '../contracts/abis'

export function useVault(vaultAddress: `0x${string}`) {
  const { data: vaultState } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'getVaultState',
    query: {
      refetchInterval: 10_000, // Refetch every 10s
    }
  })

  const { data: aura } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'getCurrentAura',
  })

  return {
    creatorCollateral: vaultState?.[0],
    fanCollateral: vaultState?.[1],
    totalCollateral: vaultState?.[2],
    totalSupply: vaultState?.[3],
    peg: vaultState?.[4],
    stage: vaultState?.[5],
    health: vaultState?.[6],
    aura,
  }
}
```

**Writing Data:**
```typescript
// components/actions/MintForm.tsx
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

export function MintForm({ vaultAddress }: { vaultAddress: `0x${string}` }) {
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

  const handleMint = async (qty: bigint, value: bigint) => {
    writeContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'mintTokens',
      args: [qty],
      value, // CELO to send
    })
  }

  // ... UI
}
```

### 4.4 Event Listening

```typescript
// lib/hooks/useVaultEvents.ts
import { useWatchContractEvent } from 'wagmi'

export function useVaultEvents(vaultAddress: `0x${string}`) {
  useWatchContractEvent({
    address: vaultAddress,
    abi: VAULT_ABI,
    eventName: 'Minted',
    onLogs(logs) {
      // Refetch vault data, show notification
      console.log('New mint:', logs)
    },
  })

  useWatchContractEvent({
    address: vaultAddress,
    abi: VAULT_ABI,
    eventName: 'SupplyCapShrink',
    onLogs(logs) {
      // Alert user about forced burn
      console.log('Forced burn triggered:', logs)
    },
  })
}
```


## 5. Utility Functions

### 5.1 Calculations (lib/utils/calculations.ts)

```typescript
// Replicate contract math for UI predictions
export function calculatePeg(aura: number): bigint {
  const BASE_PRICE = 1e18
  const A_REF = 100
  const K = 0.5
  const P_MIN = 0.3e18
  const P_MAX = 3.0e18

  const aN = aura / A_REF
  const delta = aN - 1
  const pegRaw = BASE_PRICE * (1 + K * delta)

  return BigInt(Math.floor(Math.max(P_MIN, Math.min(P_MAX, pegRaw))))
}

export function calculateSupplyCap(aura: number, baseCap: bigint): bigint {
  const A_REF = 100
  const s = 0.75
  const auraDelta = aura - A_REF
  const scaleFactor = s * auraDelta / A_REF
  const supplyCap = Number(baseCap) * (1 + scaleFactor)

  const minCap = Number(baseCap) / 4
  const maxCap = Number(baseCap) * 4

  return BigInt(Math.floor(Math.max(minCap, Math.min(maxCap, supplyCap))))
}

export function calculateHealth(
  totalCollateral: bigint,
  totalSupply: bigint,
  peg: bigint
): bigint {
  if (totalSupply === 0n) return BigInt(Number.MAX_SAFE_INTEGER)
  
  const denominator = (totalSupply * peg) / BigInt(1e18)
  return (totalCollateral * BigInt(1e18)) / denominator
}

export function calculateMintCost(
  qty: bigint,
  peg: bigint
): { collateral: bigint; fee: bigint; total: bigint } {
  const MIN_CR = BigInt(1.5e18)
  const MINT_FEE = BigInt(0.005e18)
  
  const collateral = (qty * peg * MIN_CR) / BigInt(1e18) / BigInt(1e18)
  const fee = (collateral * MINT_FEE) / BigInt(1e18)
  const total = collateral + fee

  return { collateral, fee, total }
}
```

### 5.2 Formatting (lib/utils/formatting.ts)

```typescript
export function formatCELO(wei: bigint, decimals = 4): string {
  const celo = Number(wei) / 1e18
  return celo.toFixed(decimals)
}

export function formatTokens(amount: bigint, decimals = 2): string {
  const tokens = Number(amount) / 1e18
  return tokens.toFixed(decimals)
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatHealth(health: bigint): string {
  const ratio = Number(health) / 1e18
  return `${(ratio * 100).toFixed(1)}%`
}

export function getHealthColor(health: bigint): string {
  const ratio = Number(health) / 1e18
  if (ratio >= 1.5) return 'text-green-600'
  if (ratio >= 1.2) return 'text-yellow-600'
  return 'text-red-600'
}
```

### 5.3 Validation (lib/utils/validation.ts)

```typescript
export function validateMint(
  qty: bigint,
  stage: number,
  totalSupply: bigint,
  stageCap: bigint,
  supplyCap: bigint
): { valid: boolean; error?: string } {
  if (stage === 0) {
    return { valid: false, error: 'Vault not bootstrapped' }
  }

  if (totalSupply + qty > stageCap) {
    return { valid: false, error: 'Exceeds stage capacity' }
  }

  if (totalSupply + qty > supplyCap) {
    return { valid: false, error: 'Exceeds supply cap (aura too low)' }
  }

  return { valid: true }
}

export function validateRedeem(
  qty: bigint,
  balance: bigint,
  healthAfter: bigint
): { valid: boolean; error?: string } {
  if (qty > balance) {
    return { valid: false, error: 'Insufficient balance' }
  }

  const MIN_CR = BigInt(1.5e18)
  if (healthAfter < MIN_CR) {
    return { valid: false, error: 'Would drop health below 150%' }
  }

  return { valid: true }
}
```


## 6. Iterative Development Plan

### Phase 1: Foundation (Week 1)
**Goal:** Basic Next.js app with wallet connection

**Tasks:**
1. Initialize Next.js 14 project with TypeScript
2. Install dependencies: wagmi, viem, RainbowKit, TanStack Query, Tailwind
3. Configure wagmi for Celo Alfajores
4. Set up RainbowKit wallet connection
5. Create basic layout with header + wallet button
6. Add contract ABIs and deployed addresses
7. Test wallet connection and network switching

**Deliverables:**
- Working Next.js app
- Wallet connection functional
- Can read user's CELO balance

### Phase 2: Vault Discovery (Week 1-2)
**Goal:** Display list of vaults with basic info

**Tasks:**
1. Create `useVaultList` hook to fetch vaults from factory
2. Implement VaultCard component
3. Build vault list page with grid layout
4. Add basic filtering (by creator address)
5. Implement vault detail page route
6. Create VaultStats component to display vault state
7. Add AuraDisplay component

**Deliverables:**
- Vault discovery page
- Vault detail page with live data
- Can see aura, peg, health for any vault

### Phase 3: Fan Minting (Week 2)
**Goal:** Fans can mint tokens

**Tasks:**
1. Create MintForm component
2. Implement mint cost calculation
3. Add input validation (stage, caps, health)
4. Build transaction flow (approve if needed, then mint)
5. Add transaction status UI (pending, success, error)
6. Implement event listening for Minted events
7. Add position display after minting

**Deliverables:**
- Working mint interface
- Real-time cost calculation
- Transaction feedback
- Position tracking

### Phase 4: Fan Redemption (Week 2-3)
**Goal:** Fans can redeem tokens for CELO

**Tasks:**
1. Create `usePositions` hook to fetch user positions
2. Build PositionList component
3. Implement RedeemForm component
4. Calculate estimated CELO return (FIFO logic)
5. Add health check validation
6. Build transaction flow
7. Update position list after redemption

**Deliverables:**
- Position list display
- Working redemption interface
- FIFO calculation preview
- Transaction feedback

### Phase 5: Creator Management (Week 3)
**Goal:** Creators can manage their vaults

**Tasks:**
1. Create vault creation flow (factory.createVault)
2. Build StakeForm for bootstrap and stage unlocking
3. Add stage progression UI
4. Show creator-specific metrics
5. Add creator dashboard page
6. Implement stage unlock validation

**Deliverables:**
- Vault creation interface
- Creator staking interface
- Stage progression tracking
- Creator dashboard

### Phase 6: Advanced Features (Week 3-4)
**Goal:** Forced burns, liquidations, monitoring

**Tasks:**
1. Add forced burn detection (SupplyCapShrink event)
2. Create forced burn alert UI
3. Implement `checkAndTriggerForcedBurn` button
4. Build liquidator dashboard
5. Create LiquidateForm component
6. Add health monitoring with alerts
7. Implement grace period countdown

**Deliverables:**
- Forced burn detection and alerts
- Liquidation interface
- Health monitoring dashboard
- Grace period UI

### Phase 7: Polish & Testing (Week 4)
**Goal:** Production-ready UI

**Tasks:**
1. Add loading states and skeletons
2. Implement error boundaries
3. Add toast notifications
4. Improve responsive design
5. Add dark mode support
6. Write E2E tests with Playwright
7. Optimize performance (code splitting, lazy loading)
8. Add analytics (optional)

**Deliverables:**
- Polished UI/UX
- Error handling
- Responsive design
- E2E test coverage


## 7. Key Technical Decisions

### 7.1 State Management

**Approach:** Minimal state, rely on wagmi + TanStack Query

**Rationale:**
- wagmi handles wallet state
- TanStack Query handles contract data caching
- No need for Redux/Zustand for this app size
- React Context for theme/UI preferences only

### 7.2 Data Fetching Strategy

**Approach:** Polling + Event Listening

**Rationale:**
- Poll vault state every 10s for live updates
- Listen to events for instant feedback on user actions
- Cache aggressively to reduce RPC calls
- Invalidate cache on relevant events

**Example:**
```typescript
// Refetch vault data every 10s
const { data } = useReadContract({
  ...vaultConfig,
  query: { refetchInterval: 10_000 }
})

// Invalidate on events
useWatchContractEvent({
  ...vaultConfig,
  eventName: 'Minted',
  onLogs: () => queryClient.invalidateQueries(['vault', vaultAddress])
})
```

### 7.3 Transaction UX

**Approach:** Optimistic UI + Toast Notifications

**Flow:**
1. User submits transaction
2. Show pending state immediately
3. Wait for transaction receipt
4. Show success/error toast
5. Refetch relevant data
6. Update UI

**Example:**
```typescript
const { writeContract, data: hash } = useWriteContract()
const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

useEffect(() => {
  if (isSuccess) {
    toast.success('Tokens minted successfully!')
    queryClient.invalidateQueries(['vault', vaultAddress])
  }
}, [isSuccess])
```

### 7.4 Error Handling

**Approach:** Graceful degradation + User-friendly messages

**Patterns:**
- Catch contract revert reasons and display them
- Show fallback UI if data fails to load
- Retry failed requests automatically
- Log errors to console for debugging

**Example:**
```typescript
try {
  await writeContract({ ... })
} catch (error) {
  if (error.message.includes('InsufficientCollateral')) {
    toast.error('Not enough CELO. Please add more collateral.')
  } else if (error.message.includes('ExceedsStageCap')) {
    toast.error('Stage capacity reached. Wait for next stage.')
  } else {
    toast.error('Transaction failed. Please try again.')
  }
}
```

### 7.5 Performance Optimization

**Strategies:**
- Code splitting by route (automatic with Next.js App Router)
- Lazy load heavy components (charts, modals)
- Memoize expensive calculations
- Debounce user inputs
- Use React.memo for pure components
- Optimize images with Next.js Image component


## 8. Environment Configuration

### 8.1 Required Environment Variables

```bash
# .env.local

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Celo Alfajores RPC (public or Infura/Alchemy)
NEXT_PUBLIC_RPC_URL=https://alfajores-forno.celo-testnet.org

# Deployed Contract Addresses (from deployments.json)
NEXT_PUBLIC_FACTORY_ADDRESS=0x197baBc40fC361e9c324e9e690c016A609ac09D4
NEXT_PUBLIC_ORACLE_ADDRESS=0x16C632BafA9b3ce39bdCDdB00c3D486741685425
NEXT_PUBLIC_TREASURY_ADDRESS=0xf4Dc5d7C18e71D728f04AfA31E91EE065D738221

# Optional: Analytics, monitoring
NEXT_PUBLIC_ANALYTICS_ID=
```

### 8.2 Contract Addresses Setup

```typescript
// lib/contracts/addresses.ts
export const CONTRACTS = {
  factory: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
  oracle: process.env.NEXT_PUBLIC_ORACLE_ADDRESS as `0x${string}`,
  treasury: process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`,
} as const

// Validate at build time
if (!CONTRACTS.factory || !CONTRACTS.oracle || !CONTRACTS.treasury) {
  throw new Error('Missing contract addresses in environment variables')
}
```

## 9. Testing Strategy

### 9.1 Unit Tests (Vitest)

**Coverage:**
- Utility functions (calculations, formatting, validation)
- React hooks (custom wagmi hooks)
- Component logic (form validation, state management)

**Setup:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom'
```

**Example:**
```typescript
// lib/utils/calculations.test.ts
import { describe, it, expect } from 'vitest'
import { calculatePeg, calculateMintCost } from './calculations'

describe('calculatePeg', () => {
  it('returns BASE_PRICE when aura is A_REF', () => {
    expect(calculatePeg(100)).toBe(BigInt(1e18))
  })

  it('clamps to P_MIN when aura is very low', () => {
    expect(calculatePeg(0)).toBe(BigInt(0.3e18))
  })

  it('clamps to P_MAX when aura is very high', () => {
    expect(calculatePeg(200)).toBe(BigInt(3e18))
  })
})
```

### 9.2 Integration Tests (Playwright)

**Coverage:**
- Wallet connection flow
- Vault discovery and navigation
- Minting flow (with test wallet)
- Redemption flow
- Creator staking flow

**Example:**
```typescript
// e2e/mint.spec.ts
import { test, expect } from '@playwright/test'

test('fan can mint tokens', async ({ page }) => {
  await page.goto('/vaults/0x123...')
  
  // Connect wallet (mock)
  await page.click('button:has-text("Connect Wallet")')
  await page.click('button:has-text("MetaMask")')
  
  // Fill mint form
  await page.fill('input[name="quantity"]', '10')
  await page.click('button:has-text("Mint Tokens")')
  
  // Wait for transaction
  await expect(page.locator('text=Transaction pending')).toBeVisible()
  await expect(page.locator('text=Tokens minted successfully')).toBeVisible({ timeout: 30000 })
})
```

### 9.3 Manual Testing Checklist

**Pre-deployment:**
- [ ] Wallet connection works on Alfajores
- [ ] Can view all deployed vaults
- [ ] Vault stats display correctly
- [ ] Aura and peg update in real-time
- [ ] Mint form calculates costs correctly
- [ ] Minting creates position
- [ ] Redemption returns correct CELO
- [ ] Creator can bootstrap and unlock stages
- [ ] Forced burn detection works
- [ ] Liquidation interface functional
- [ ] Mobile responsive
- [ ] Error states display properly
- [ ] Loading states show correctly


## 10. Deployment Strategy

### 10.1 Hosting Options

**Recommended: Vercel**
- Native Next.js support
- Automatic deployments from Git
- Edge network for fast loading
- Free tier sufficient for MVP

**Alternative: Netlify, Railway, or self-hosted**

### 10.2 Deployment Checklist

**Pre-deployment:**
1. Set environment variables in Vercel dashboard
2. Test build locally: `npm run build`
3. Run E2E tests: `npm run test:e2e`
4. Check bundle size: `npm run build` (Next.js shows bundle size automatically)
5. Verify contract addresses are correct

**Post-deployment:**
1. Test on production URL
2. Verify wallet connection works
3. Test all critical flows (mint, redeem, stake)
4. Monitor error logs
5. Set up uptime monitoring (optional)

### 10.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 11. Future Enhancements

### 11.1 Phase 2 Features (Post-MVP)

**Enhanced Discovery:**
- Search by creator name (Farcaster integration)
- Advanced filters (TVL range, health range, aura range)
- Sorting options (newest, highest TVL, best health)
- Vault categories/tags

**Analytics Dashboard:**
- Historical aura chart
- Peg history chart
- TVL over time
- Position performance tracking
- ROI calculator

**Social Features:**
- Farcaster profile integration
- Creator bio and links
- Fan leaderboard
- Share vault on social media

**Notifications:**
- Email/push alerts for forced burns
- Health warnings
- Aura updates
- Position value changes

### 11.2 Technical Improvements

**Performance:**
- Implement GraphQL API (The Graph) for faster queries
- Add service worker for offline support
- Optimize bundle size further
- Implement virtual scrolling for large lists

**UX:**
- Add onboarding tutorial
- Implement keyboard shortcuts
- Add accessibility improvements (ARIA labels, screen reader support)
- Multi-language support (i18n)

**Developer Experience:**
- Add Storybook for component documentation
- Implement visual regression testing
- Add performance monitoring (Lighthouse CI)
- Create component library


## 12. Risk Mitigation & Edge Cases

### 12.1 Contract Interaction Risks

**Issue:** Transaction reverts with unclear error
**Mitigation:**
- Parse revert reasons from contract errors
- Display user-friendly error messages
- Add pre-flight validation to catch errors before sending TX

**Issue:** Gas estimation fails
**Mitigation:**
- Set manual gas limits for known operations
- Show gas cost estimate before transaction
- Warn users about high gas costs

**Issue:** RPC node downtime
**Mitigation:**
- Configure multiple RPC endpoints
- Implement automatic failover
- Show clear error when all RPCs fail

### 12.2 Data Consistency Issues

**Issue:** Stale data after transaction
**Mitigation:**
- Invalidate queries after successful transactions
- Use optimistic updates for instant feedback
- Poll more frequently after user actions

**Issue:** Race conditions (multiple users minting simultaneously)
**Mitigation:**
- Refetch data before transaction
- Handle "supply cap exceeded" errors gracefully
- Show real-time supply cap utilization

### 12.3 User Experience Edge Cases

**Issue:** User has no CELO for gas
**Mitigation:**
- Check balance before showing forms
- Display clear message about needing CELO
- Link to Celo faucet for testnet

**Issue:** User on wrong network
**Mitigation:**
- Detect network automatically
- Show prominent banner to switch
- Provide one-click network switch

**Issue:** Wallet not installed
**Mitigation:**
- Detect wallet availability
- Show installation instructions
- Provide links to wallet downloads

**Issue:** Transaction stuck/pending
**Mitigation:**
- Show pending state with spinner
- Add "speed up" option (increase gas)
- Add "cancel" option if possible
- Timeout after 5 minutes with retry option

### 12.4 Security Considerations

**Issue:** Malicious contract addresses
**Mitigation:**
- Hardcode official contract addresses
- Validate addresses before interactions
- Show warnings for unknown contracts

**Issue:** Phishing attacks
**Mitigation:**
- Display clear transaction details before signing
- Show expected outcomes (e.g., "You will receive ~X tokens")
- Warn about suspicious transactions

**Issue:** Front-running
**Mitigation:**
- Educate users about MEV risks
- Consider implementing slippage protection
- Show expected vs actual outcomes


## 13. Quick Start Commands

### 13.1 Initial Setup

```bash
# Create Next.js project
npx create-next-app@15.2.4 aurafi-frontend --typescript --tailwind --app

cd aurafi-frontend

# Install core dependencies
npm install wagmi@^2.18.2 viem@^2.38.4 @tanstack/react-query@^5.90.5 @rainbow-me/rainbowkit@^2.2.9

# Install UI dependencies
npm install sonner@^2.0.7 date-fns@^4.1.0 clsx@^2.1.1 tailwind-merge@^3.3.1 tailwindcss-animate@^1.0.7
npm install lucide-react@^0.548.0 cmdk@^1.1.1 vaul@^1.1.2 embla-carousel-react@^8.6.0 input-otp@^1.4.2

# Install form handling
npm install react-hook-form@^7.65.0 @hookform/resolvers@^5.2.2 zod@^4.1.12

# Install Radix UI components (optional, for advanced UI)
npm install @radix-ui/react-dialog@^1.1.15 @radix-ui/react-dropdown-menu@^2.1.16
npm install @radix-ui/react-label@^2.1.7 @radix-ui/react-slot@^1.2.3
npm install @radix-ui/react-toast@^1.2.15 @radix-ui/react-tooltip@^1.2.8
npm install @radix-ui/react-tabs@^1.1.13 @radix-ui/react-progress@^1.1.7
npm install @radix-ui/react-avatar@^1.1.10 @radix-ui/react-separator@^1.1.7

# Install dev dependencies
npm install -D @playwright/test
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom

# Note: You'll need to create vitest.config.ts for unit tests to work
# See testing section for configuration
```

### 13.2 Development Workflow

```bash
# Start development server
npm run dev

# Run tests
npm run test              # Unit tests (requires vitest setup)
npx playwright test       # E2E tests

# Build for production
npm run build

# Start production server
npm run start

# Lint
npm run lint

# Format (requires prettier setup)
npx prettier --write .
```

### 13.3 Useful Scripts (package.json)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\""
  }
}
```

## 14. Success Metrics

### 14.1 Technical Metrics

- **Page Load Time:** < 2s on 3G
- **Time to Interactive:** < 3s
- **Bundle Size:** < 500KB (gzipped)
- **Lighthouse Score:** > 90
- **Test Coverage:** > 80%

### 14.2 User Metrics

- **Wallet Connection Rate:** > 70% of visitors
- **Transaction Success Rate:** > 95%
- **Average Time to Mint:** < 30s
- **Error Rate:** < 5%
- **Mobile Usage:** > 30%

### 14.3 Business Metrics

- **Daily Active Users:** Track growth
- **Total Value Locked:** Monitor TVL across all vaults
- **Transaction Volume:** Track mints/redeems per day
- **Vault Creation Rate:** New vaults per week

## 15. Documentation Requirements

### 15.1 User Documentation

**Getting Started Guide:**
- How to connect wallet
- How to get testnet CELO
- How to mint tokens
- How to redeem tokens

**Creator Guide:**
- How to create a vault
- How to bootstrap and unlock stages
- How to monitor vault health
- How to respond to forced burns

**FAQ:**
- What is aura?
- How is the peg calculated?
- What happens during forced burn?
- What is liquidation?

### 15.2 Developer Documentation

**README.md:**
- Project overview
- Setup instructions
- Development workflow
- Deployment guide

**CONTRIBUTING.md:**
- Code style guide
- PR process
- Testing requirements
- Commit message format

**API Documentation:**
- Contract interaction patterns
- Custom hooks API
- Utility functions
- Component props


## 16. Summary & Next Steps

### 16.1 What We've Defined

This game plan provides:

1. **Complete Protocol Understanding**
   - User journeys for creators, fans, and liquidators
   - Contract relationships and data flow
   - Economic mechanics (peg, supply cap, health)

2. **Comprehensive Architecture**
   - Next.js 14 project structure
   - Component breakdown with responsibilities
   - Web3 integration strategy with wagmi/viem

3. **Implementation Roadmap**
   - 7-phase iterative development plan
   - Week-by-week deliverables
   - Clear milestones and dependencies

4. **Technical Specifications**
   - Utility functions for calculations
   - Data fetching and caching strategy
   - Transaction UX patterns
   - Error handling approaches

5. **Production Readiness**
   - Testing strategy (unit + E2E)
   - Deployment checklist
   - Risk mitigation
   - Success metrics

### 16.2 Immediate Next Steps

**To start building the frontend:**

1. **Initialize Project** (30 minutes)
   ```bash
   # Create Next.js app
   npx create-next-app@15.2.4 aurafi-frontend --typescript --tailwind --app
   cd aurafi-frontend
   npm install wagmi@^2.18.2 viem@^2.38.4 @tanstack/react-query@^5.90.5 @rainbow-me/rainbowkit@^2.2.9
   npm install sonner@^2.0.7 date-fns@^4.1.0 clsx@^2.1.1 tailwind-merge@^3.3.1
   ```

2. **Set Up Configuration** (1 hour)
   - Copy contract ABIs from `out/` directory
   - Create `lib/contracts/addresses.ts` with deployed addresses
   - Configure wagmi for Celo Alfajores
   - Set up RainbowKit providers

3. **Build Foundation** (2-3 hours)
   - Create root layout with wallet connection
   - Add basic routing structure
   - Implement ConnectButton component
   - Test wallet connection on Alfajores

4. **First Feature: Vault Discovery** (4-6 hours)
   - Create `useVaultList` hook
   - Build VaultCard component
   - Implement vault list page
   - Add vault detail page

5. **Second Feature: Vault Stats** (3-4 hours)
   - Create `useVault` hook
   - Build VaultStats component
   - Add AuraDisplay component
   - Show real-time data

**After these steps, you'll have:**
- Working Next.js app deployed on Vercel
- Wallet connection functional
- Vault discovery and detail pages
- Real-time data from deployed contracts

**Then continue with:**
- Phase 3: Fan minting interface
- Phase 4: Redemption interface
- Phase 5: Creator management
- Phase 6: Advanced features (forced burns, liquidations)
- Phase 7: Polish and testing

### 16.3 Key Success Factors

1. **Start Simple:** Build core features first, polish later
2. **Test Early:** Test on Alfajores with real contracts from day 1
3. **Iterate Fast:** Deploy frequently, get feedback, improve
4. **Focus on UX:** Make complex DeFi mechanics easy to understand
5. **Handle Errors:** Graceful error handling builds trust

### 16.4 Resources

**Documentation:**
- [wagmi docs](https://wagmi.sh)
- [viem docs](https://viem.sh)
- [RainbowKit docs](https://www.rainbowkit.com)
- [Next.js docs](https://nextjs.org/docs)
- [Celo docs](https://docs.celo.org)

**Tools:**
- [Celo Alfajores Faucet](https://faucet.celo.org)
- [Celo Explorer](https://alfajores.celoscan.io)
- [WalletConnect Cloud](https://cloud.walletconnect.com)

**Community:**
- Celo Discord
- wagmi GitHub Discussions
- Next.js Discord

---

## Appendix: Example Code Snippets

### A. Root Layout with Providers

```typescript
// app/layout.tsx
'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from '@/lib/wagmi'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              {children}
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}
```

### B. Vault List Hook

```typescript
// lib/hooks/useVaultList.ts
import { useReadContract } from 'wagmi'
import { CONTRACTS } from '../contracts/addresses'
import { FACTORY_ABI } from '../contracts/abis'

export function useVaultList() {
  // In production, fetch from events or subgraph
  // For MVP, maintain a list of known vaults
  const knownVaults = [
    '0x...', // Add vault addresses here
  ]

  return {
    vaults: knownVaults,
    isLoading: false,
  }
}
```

### C. Mint Form Component

```typescript
// components/actions/MintForm.tsx
'use client'

import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { VAULT_ABI } from '@/lib/contracts/abis'
import { calculateMintCost } from '@/lib/utils/calculations'
import { toast } from 'sonner'

export function MintForm({ vaultAddress, peg }: { vaultAddress: `0x${string}`, peg: bigint }) {
  const [quantity, setQuantity] = useState('')
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

  const handleMint = async () => {
    const qty = parseEther(quantity)
    const { total } = calculateMintCost(qty, peg)

    writeContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'mintTokens',
      args: [qty],
      value: total,
    })
  }

  if (isSuccess) {
    toast.success('Tokens minted successfully!')
  }

  return (
    <div className="space-y-4">
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Quantity"
        className="w-full px-4 py-2 border rounded"
      />
      <button
        onClick={handleMint}
        disabled={isLoading || !quantity}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {isLoading ? 'Minting...' : 'Mint Tokens'}
      </button>
    </div>
  )
}
```

---

**This game plan is ready to be executed. Start with Phase 1 and iterate from there!**
