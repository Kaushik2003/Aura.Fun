# AuraFi Frontend Design Document

## Overview

The AuraFi frontend is a Next.js 15 application using the App Router that provides a comprehensive interface for interacting with the AuraFi protocol smart contracts. The application supports three primary user roles (Creators, Fans, and Liquidators) and implements environment-based configuration to support both local Anvil development and Sepolia testnet deployment.

### Technology Stack

**Core Framework:**
- Next.js 15 with App Router (React 19+)
- TypeScript for type safety
- Tailwind CSS for styling

**Web3 Integration:**
- wagmi v2 - React hooks for Ethereum
- viem v2 - TypeScript Ethereum library
- RainbowKit v2 - Wallet connection UI
- TanStack Query v5 - Data fetching and caching

**UI Components:**
- Radix UI primitives for accessible components
- Lucide React for icons
- Sonner for toast notifications
- React Hook Form + Zod for form validation

### Architecture Principles

1. **Environment-Based Configuration**: Single codebase supports both Anvil (local) and Sepolia (testnet) via environment variables
2. **Type Safety**: Full TypeScript coverage with contract ABI types
3. **Real-Time Updates**: Polling + event listening for live data
4. **Optimistic UI**: Immediate feedback with background validation
5. **Error Resilience**: Graceful degradation and user-friendly error messages
6. **Mobile-First**: Responsive design for all screen sizes

**Design Rationale**: We chose Next.js 15 App Router for its server components, improved performance, and built-in routing. wagmi v2 + viem v2 provide the most modern and type-safe Web3 integration. RainbowKit offers the best wallet connection UX with minimal setup. TanStack Query handles caching and real-time updates efficiently.

## Architecture

### Routing Structure

The application uses role-based routing to provide distinct experiences for fans and creators:

**Fan Routes:**
- `/` - Landing page with overview
- `/vaults` - Browse all creator vaults (fan perspective)
- `/vaults/[address]` - View vault details and mint/redeem tokens
- `/liquidate` - Liquidation opportunities dashboard

**Creator Routes:**
- `/creator` - Creator dashboard showing all owned vaults
- `/creator/create` - Create new vault form
- `/creator/vaults/[address]` - Manage specific vault (creator perspective)

**Admin Routes:**
- `/admin` - Admin dashboard for Treasury management (owner-only)

**Shared Routes:**
- All routes accessible to both roles
- Vault detail pages redirect creators to management view
- Navigation adapts based on connected wallet's role
- Admin routes only accessible to Treasury owner

**Design Rationale**: Separate routes for fans and creators provide focused experiences. Fans see investment-oriented views, creators see management-oriented views. The `/creator` prefix clearly indicates creator-specific functionality. The `/admin` route is protected and only accessible to the Treasury contract owner. Automatic redirects ensure users land on the appropriate view for their role.

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────┐
│                    app/layout.tsx                       │
│  (Root Layout with Providers: Wagmi, Query, RainbowKit)│
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────────────┐
        │                   │                           │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────────────▼────────┐
│  app/page.tsx  │  │app/vaults/  │  │  app/creator/           │
│  (Landing)     │  │  page.tsx   │  │   page.tsx              │
│                │  │ (Fan View)  │  │ (Creator Dashboard)     │
└────────────────┘  └──────┬──────┘  └──────┬──────────────────┘
                           │                 │
                    ┌──────▼──────────┐      │
                    │app/vaults/      │      │
                    │[address]/       │      │
                    │page.tsx         │      │
                    │(Fan Vault View) │      │
                    └─────────────────┘      │
                           │                 │
        ┌──────────────────┼─────────┐       │
        │                  │         │       │
┌───────▼────────┐  ┌─────▼──────┐  │       │
│ MintForm       │  │ RedeemForm │  │       │
│ (Fan Action)   │  │(Fan Action)│  │       │
└────────────────┘  └────────────┘  │       │
                                    │       │
                    ┌───────────────▼───────▼──────────┐
                    │app/creator/vaults/[address]/     │
                    │page.tsx                          │
                    │(Creator Vault Management)        │
                    └──────────────────┬───────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
            ┌───────▼────────┐  ┌─────▼──────┐  ┌───────▼────────┐
            │ BootstrapForm  │  │StageUnlock │  │ VaultSettings  │
            │(Creator Action)│  │(Creator)   │  │ (Creator)      │
            └────────────────┘  └────────────┘  └────────────────┘

┌─────────────────────────────────────────────────────────┐
│              app/liquidate/page.tsx                     │
│         (Liquidator Dashboard)                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              app/admin/page.tsx                         │
│         (Treasury Admin Panel - Owner Only)             │
└──────────────────┬──────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼────────┐ ┌──▼─────────┐ ┌──▼──────────┐
│ Treasury   │ │ Withdrawal │ │ Fee History │
│ Balance    │ │ Form       │ │ (Events)    │
└────────────┘ └────────────┘ └─────────────┘
```

### Data Flow Architecture

```
┌──────────────┐
│   User UI    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐      ┌─────────────────┐
│  React Hook Form │─────▶│  Zod Validation │
└──────┬───────────┘      └─────────────────┘
       │
       ▼
┌──────────────────┐      ┌─────────────────┐
│  wagmi Hooks     │◄────▶│ TanStack Query  │
│  (useWriteContract,│     │  (Caching)      │
│   useReadContract) │     └─────────────────┘
└──────┬───────────┘
       │
       ▼
┌──────────────────┐      ┌─────────────────┐
│  viem Client     │◄────▶│  Event Listener │
│  (Contract Calls)│      │  (Real-time)    │
└──────┬───────────┘      └─────────────────┘
       │
       ▼
┌──────────────────┐
│  Smart Contracts │
│  (VaultFactory,  │
│   CreatorVault,  │
│   AuraOracle)    │
└──────────────────┘
```

**Design Rationale**: This architecture separates concerns cleanly - UI components handle presentation, React Hook Form + Zod handle validation, wagmi handles blockchain interactions, and TanStack Query manages caching and refetching. Event listeners provide real-time updates without constant polling.

### Environment Configuration Strategy

The application uses a dual-environment approach to support both local development and testnet deployment:

**Configuration Files:**
- `.env.local` - Local Anvil development
- `.env.production` - Sepolia testnet deployment

**Environment Variables:**
```
NEXT_PUBLIC_NETWORK=anvil|sepolia
NEXT_PUBLIC_RPC_URL=<network-specific-rpc>
NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=<deployed-address>
NEXT_PUBLIC_AURA_ORACLE_ADDRESS=<deployed-address>
NEXT_PUBLIC_TREASURY_ADDRESS=<deployed-address>
```

**Network Configuration Object:**
```typescript
const networkConfig = {
  anvil: {
    chainId: 31337,
    rpcUrl: 'http://localhost:8545',
    name: 'Anvil Local',
  },
  sepolia: {
    chainId: 11155111,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
    name: 'Sepolia Testnet',
  },
}
```

**Design Rationale**: Environment-based configuration allows seamless switching between networks without code changes. This supports rapid local iteration with Anvil while maintaining production-ready Sepolia deployment. Address validation prevents runtime errors from misconfiguration.

## Components and Interfaces

### Core Provider Setup

**File: `app/providers.tsx`**

```typescript
'use client'

import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi-config'

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchInterval: 10000, // Poll every 10 seconds
        staleTime: 5000,
      },
    },
  })

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

**Design Rationale**: Providers are separated into a client component to enable server components in the app directory. The 10-second polling interval balances real-time updates with RPC call efficiency. TanStack Query's caching prevents redundant calls.

### Navigation Component

**File: `components/navigation.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'
import { WalletConnect } from './wallet-connect'
import { useCreatorVaults } from '@/hooks/use-creator-vaults'

export function Navigation() {
  const pathname = usePathname()
  const { address } = useAccount()
  const { vaults } = useCreatorVaults(address)
  
  // Check if user is treasury owner
  const { data: treasuryOwner } = useReadContract({
    address: getContractAddress('TREASURY'),
    abi: TREASURY_ABI,
    functionName: 'owner',
  })
  
  const isCreator = vaults && vaults.length > 0
  const isAdmin = address && treasuryOwner && address.toLowerCase() === treasuryOwner.toLowerCase()

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold">
              AuraFi
            </Link>
            
            <div className="flex gap-4">
              <Link
                href="/vaults"
                className={`px-3 py-2 rounded ${
                  pathname.startsWith('/vaults') && !pathname.includes('/creator')
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Browse Vaults
              </Link>
              
              {isCreator && (
                <Link
                  href="/creator"
                  className={`px-3 py-2 rounded ${
                    pathname.startsWith('/creator')
                      ? 'bg-purple-100 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Creator Dashboard
                </Link>
              )}
              
              <Link
                href="/liquidate"
                className={`px-3 py-2 rounded ${
                  pathname === '/liquidate'
                    ? 'bg-red-100 text-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Liquidate
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded ${
                    pathname === '/admin'
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          <WalletConnect />
        </div>
      </div>
    </nav>
  )
}
```

**Design Rationale**: The navigation adapts based on user role - creators see the "Creator Dashboard" link, treasury owner sees the "Admin" link. Active route highlighting helps users understand their current location. The navigation is responsive and collapses on mobile. Color coding (blue for fan, purple for creator, red for liquidator, orange for admin) provides visual distinction. The admin link only appears for the treasury owner, maintaining security.

### Wallet Connection Component

**File: `components/wallet-connect.tsx`**

```typescript
'use client'

import { useAccount, useBalance, useDisconnect, useSwitchChain } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useNetworkConfig } from '@/hooks/use-network-config'

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount()
  const { data: balance } = useBalance({ address })
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const { targetChain, isWrongNetwork } = useNetworkConfig()

  if (!isConnected) {
    return <ConnectButton />
  }

  return (
    <div className="flex items-center gap-4">
      {isWrongNetwork && (
        <div className="bg-yellow-100 border border-yellow-400 px-4 py-2 rounded">
          <p className="text-sm text-yellow-800">
            Wrong network: {chain?.name}. Please switch to {targetChain.name}
          </p>
          <button
            onClick={() => switchChain({ chainId: targetChain.id })}
            className="text-sm underline"
          >
            Switch Network
          </button>
        </div>
      )}
      <div className="text-sm">
        <p className="font-mono">{formatAddress(address)}</p>
        <p className="text-gray-600">{balance?.formatted} CELO</p>
      </div>
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  )
}

function formatAddress(address?: string) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
```

**Design Rationale**: RainbowKit's ConnectButton provides a polished wallet selection UI. The wrong network warning is prominent but non-blocking, allowing users to see the issue and fix it with one click. Address truncation improves readability while maintaining uniqueness.

### Fan Vault Discovery Page

**File: `app/vaults/page.tsx`**

```typescript
'use client'

import { useVaults } from '@/hooks/use-vaults'
import { FanVaultCard } from '@/components/fan-vault-card'
import { VaultFilters } from '@/components/vault-filters'
import { useState } from 'react'

export default function VaultsPage() {
  const { vaults, isLoading } = useVaults()
  const [filters, setFilters] = useState({
    creator: '',
    healthMin: 0,
    healthMax: 300,
    stage: null,
  })
  const [sortBy, setSortBy] = useState<'tvl' | 'aura' | 'health'>('tvl')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredVaults = vaults
    ?.filter(v => {
      if (filters.creator && !v.creator.toLowerCase().includes(filters.creator.toLowerCase())) {
        return false
      }
      if (v.health < filters.healthMin || v.health > filters.healthMax) {
        return false
      }
      if (filters.stage !== null && v.stage !== filters.stage) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1
      return (a[sortBy] - b[sortBy]) * multiplier
    })

  if (isLoading) {
    return <VaultCardSkeleton count={6} />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Discover Creator Vaults</h1>
        <p className="text-gray-600">Browse and invest in creator tokens</p>
      </div>
      
      <VaultFilters
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filteredVaults?.map(vault => (
          <FanVaultCard key={vault.address} vault={vault} />
        ))}
      </div>
    </div>
  )
}
```

**Design Rationale**: The fan view focuses on discovery and investment opportunities. Client-side filtering and sorting provide instant feedback. The responsive grid adapts to screen size. Clear messaging helps fans understand this is where they browse vaults to invest in.

### Creator Dashboard Page

**File: `app/creator/page.tsx`**

```typescript
'use client'

import { useAccount } from 'wagmi'
import { useCreatorVaults } from '@/hooks/use-creator-vaults'
import { CreatorVaultCard } from '@/components/creator-vault-card'
import { CreatorStats } from '@/components/creator-stats'
import Link from 'next/link'

export default function CreatorDashboardPage() {
  const { address } = useAccount()
  const { vaults, isLoading, stats } = useCreatorVaults(address)

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">Connect your wallet to view your creator dashboard</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
        <Link
          href="/creator/create"
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
        >
          Create New Vault
        </Link>
      </div>

      {stats && <CreatorStats stats={stats} />}

      {vaults && vaults.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold mb-2">No Vaults Yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first vault to start building your creator economy
          </p>
          <Link
            href="/creator/create"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            Create Vault
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {vaults?.map(vault => (
            <CreatorVaultCard key={vault.address} vault={vault} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Design Rationale**: The creator dashboard provides a centralized view of all their vaults with aggregate statistics. The prominent "Create New Vault" button encourages vault creation. Empty state guides new creators to create their first vault. The layout is optimized for managing multiple vaults.

### Fan Vault Card Component

**File: `components/fan-vault-card.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { formatEther } from 'viem'

interface FanVaultCardProps {
  vault: {
    address: string
    creator: string
    tokenName: string
    tokenSymbol: string
    aura: number
    peg: bigint
    health: number
    tvl: bigint
    stage: number
    totalSupply: bigint
    supplyCap: bigint
  }
}

export function FanVaultCard({ vault }: FanVaultCardProps) {
  const healthColor = 
    vault.health >= 150 ? 'text-green-600' :
    vault.health >= 120 ? 'text-yellow-600' :
    'text-red-600'

  const capacityUsed = (Number(vault.totalSupply) / Number(vault.supplyCap)) * 100

  return (
    <Link href={`/vaults/${vault.address}`}>
      <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">{vault.tokenName}</h3>
            <p className="text-sm text-gray-600">${vault.tokenSymbol}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Stage {vault.stage}</p>
            <p className={`text-lg font-bold ${healthColor}`}>
              {vault.health.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Creator:</span>
            <span className="font-mono">{formatAddress(vault.creator)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Aura Score:</span>
            <span className="font-semibold">{vault.aura}/200</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Token Price:</span>
            <span className="font-semibold">{formatEther(vault.peg)} CELO</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">TVL:</span>
            <span className="font-semibold">{formatEther(vault.tvl)} CELO</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Capacity</span>
            <span>{capacityUsed.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(capacityUsed, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
```

**Design Rationale**: The fan card emphasizes investment metrics like token price, TVL, and capacity. The capacity bar helps fans see if there's room to mint. Color-coded health shows vault safety. The layout is optimized for comparing investment opportunities.

### Creator Vault Card Component

**File: `components/creator-vault-card.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { formatEther } from 'viem'

interface CreatorVaultCardProps {
  vault: {
    address: string
    tokenName: string
    tokenSymbol: string
    aura: number
    stage: number
    creatorCollateral: bigint
    fanCollateral: bigint
    totalSupply: bigint
    health: number
  }
}

export function CreatorVaultCard({ vault }: CreatorVaultCardProps) {
  const healthColor = 
    vault.health >= 150 ? 'text-green-600' :
    vault.health >= 120 ? 'text-yellow-600' :
    'text-red-600'

  const nextStageRequirements = [0, 0.001, 0.003, 0.008, 0.018]
  const nextStage = vault.stage < 4 ? vault.stage + 1 : null
  const nextStageRequired = nextStage ? nextStageRequirements[nextStage] : null

  return (
    <Link href={`/creator/vaults/${vault.address}`}>
      <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">{vault.tokenName}</h3>
            <p className="text-sm text-gray-600">${vault.tokenSymbol}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Stage {vault.stage}/4</p>
            <p className={`text-lg font-bold ${healthColor}`}>
              {vault.health.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Aura Score:</span>
            <span className="font-semibold">{vault.aura}/200</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Your Collateral:</span>
            <span className="font-semibold">{formatEther(vault.creatorCollateral)} CELO</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fan Collateral:</span>
            <span className="font-semibold">{formatEther(vault.fanCollateral)} CELO</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Supply:</span>
            <span className="font-semibold">{formatEther(vault.totalSupply)} tokens</span>
          </div>
        </div>

        {nextStage && nextStageRequired && (
          <div className="border-t pt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Next Stage: {nextStageRequired} CELO</span>
              <span>{((Number(vault.creatorCollateral) / (nextStageRequired * 1e18)) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ 
                  width: `${Math.min((Number(vault.creatorCollateral) / (nextStageRequired * 1e18)) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        )}

        {vault.stage === 4 && (
          <div className="border-t pt-3 text-center">
            <span className="text-sm font-semibold text-purple-600">✓ Max Stage Reached</span>
          </div>
        )}
      </div>
    </Link>
  )
}
```

**Design Rationale**: The creator card emphasizes management metrics like collateral breakdown, stage progression, and health. The progress bar shows how close they are to unlocking the next stage. The layout is optimized for monitoring and managing vaults.

### Fan Vault Detail Page

**File: `app/vaults/[address]/page.tsx`**

```typescript
'use client'

import { useVaultState } from '@/hooks/use-vault-state'
import { useAccount } from 'wagmi'
import { MintForm } from '@/components/mint-form'
import { RedeemForm } from '@/components/redeem-form'
import { ForcedBurnAlert } from '@/components/forced-burn-alert'
import { UserPositions } from '@/components/user-positions'
import { FanVaultMetrics } from '@/components/fan-vault-metrics'
import { AuraChart } from '@/components/aura-chart'

export default function FanVaultDetailPage({ params }: { params: { address: string } }) {
  const { address: userAddress } = useAccount()
  const { vault, isLoading, refetch } = useVaultState(params.address)

  if (isLoading) {
    return <VaultDetailSkeleton />
  }

  if (!vault) {
    return <div>Vault not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{vault.tokenName}</h1>
        <p className="text-gray-600">Invest in this creator's token</p>
      </div>

      {vault.pendingForcedBurn > 0n && (
        <ForcedBurnAlert vault={vault} onExecuted={refetch} />
      )}

      {vault.stage === 0 && (
        <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            This vault is not yet active. The creator needs to bootstrap it with 0.001 CELO first.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FanVaultMetrics vault={vault} />
          <AuraChart vaultAddress={params.address} currentAura={vault.aura} />
          
          {userAddress && (
            <UserPositions vaultAddress={params.address} userAddress={userAddress} />
          )}
        </div>

        <div className="space-y-6">
          {vault.stage > 0 ? (
            <>
              <MintForm vault={vault} onSuccess={refetch} />
              <RedeemForm vault={vault} userAddress={userAddress} onSuccess={refetch} />
            </>
          ) : (
            <div className="border rounded-lg p-6 text-center text-gray-600">
              <p>Minting not available yet</p>
              <p className="text-sm mt-2">Wait for creator to bootstrap vault</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Design Rationale**: The fan view emphasizes investment information and actions. The aura chart helps fans understand creator engagement trends. Clear messaging when vault is not bootstrapped prevents confusion. The layout prioritizes mint/redeem actions.

### Creator Vault Management Page

**File: `app/creator/vaults/[address]/page.tsx`**

```typescript
'use client'

import { useVaultState } from '@/hooks/use-vault-state'
import { useAccount } from 'wagmi'
import { BootstrapForm } from '@/components/bootstrap-form'
import { StageUnlockForm } from '@/components/stage-unlock-form'
import { ForcedBurnAlert } from '@/components/forced-burn-alert'
import { CreatorVaultMetrics } from '@/components/creator-vault-metrics'
import { FanPositionsList } from '@/components/fan-positions-list'
import { VaultAnalytics } from '@/components/vault-analytics'
import { redirect } from 'next/navigation'

export default function CreatorVaultManagementPage({ params }: { params: { address: string } }) {
  const { address: userAddress } = useAccount()
  const { vault, isLoading, refetch } = useVaultState(params.address)

  if (isLoading) {
    return <VaultDetailSkeleton />
  }

  if (!vault) {
    return <div>Vault not found</div>
  }

  // Redirect if not the creator
  if (userAddress?.toLowerCase() !== vault.creator.toLowerCase()) {
    redirect(`/vaults/${params.address}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{vault.tokenName} Management</h1>
        <p className="text-gray-600">Manage your creator vault</p>
      </div>

      {vault.pendingForcedBurn > 0n && (
        <ForcedBurnAlert vault={vault} onExecuted={refetch} />
      )}

      {vault.stage === 0 && (
        <div className="bg-blue-50 border border-blue-400 rounded-lg p-4 mb-6">
          <p className="text-blue-800 font-semibold mb-2">
            Bootstrap your vault to get started
          </p>
          <p className="text-blue-700 text-sm">
            Deposit 100 CELO to unlock Stage 1 and allow fans to mint your tokens
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CreatorVaultMetrics vault={vault} />
          <VaultAnalytics vault={vault} />
          <FanPositionsList vaultAddress={params.address} />
        </div>

        <div className="space-y-6">
          {vault.stage === 0 ? (
            <BootstrapForm vaultAddress={params.address} onSuccess={refetch} />
          ) : (
            <>
              {vault.stage < 4 && (
                <StageUnlockForm vault={vault} onSuccess={refetch} />
              )}
              
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Vault Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Stage:</span>
                    <span className="font-semibold">{vault.stage}/4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Fans:</span>
                    <span className="font-semibold">{vault.activeFanCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Mints:</span>
                    <span className="font-semibold">{vault.totalMints || 0}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Design Rationale**: The creator management view emphasizes control and analytics. Bootstrap prompt is prominent when vault is not active. Stage unlock is the primary action. Analytics and fan positions help creators understand their vault's performance. Access control redirects non-creators to the fan view.

### Mint Form Component

**File: `components/mint-form.tsx`**

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'sonner'
import { VAULT_ABI } from '@/lib/abis'

const mintSchema = z.object({
  quantity: z.string().refine(val => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, 'Quantity must be greater than 0'),
})

export function MintForm({ vault, onSuccess }: MintFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(mintSchema),
  })

  const quantity = watch('quantity')
  const quantityBigInt = quantity ? parseEther(quantity) : 0n
  const requiredCollateral = (quantityBigInt * vault.peg * 150n) / 100n
  const mintFee = (requiredCollateral * 5n) / 1000n // 0.5%
  const totalCost = requiredCollateral + mintFee

  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const onSubmit = async (data: z.infer<typeof mintSchema>) => {
    try {
      // Validation
      if (vault.stage === 0) {
        toast.error('Vault not bootstrapped. Creator must deposit 100 CELO first.')
        return
      }

      const newSupply = vault.totalSupply + quantityBigInt
      const stageCap = getStageCap(vault.stage)
      if (newSupply > stageCap) {
        toast.error('Stage capacity reached. Wait for creator to unlock next stage.')
        return
      }

      if (newSupply > vault.supplyCap) {
        toast.error('Supply cap reached due to low aura. Wait for aura to increase.')
        return
      }

      writeContract({
        address: vault.address,
        abi: VAULT_ABI,
        functionName: 'mintTokens',
        args: [quantityBigInt],
        value: totalCost,
      }, {
        onSuccess: () => {
          toast.success('Tokens minted successfully!')
          onSuccess()
        },
        onError: (error) => {
          toast.error(parseContractError(error))
        },
      })
    } catch (error) {
      toast.error('Transaction failed. Please try again.')
      console.error(error)
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Mint Tokens</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Token Quantity
          </label>
          <input
            type="text"
            {...register('quantity')}
            className="w-full border rounded px-3 py-2"
            placeholder="0.0"
          />
          {errors.quantity && (
            <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>
          )}
        </div>

        {quantity && (
          <div className="bg-gray-50 rounded p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Required Collateral:</span>
              <span className="font-semibold">{formatEther(requiredCollateral)} CELO</span>
            </div>
            <div className="flex justify-between">
              <span>Mint Fee (0.5%):</span>
              <span className="font-semibold">{formatEther(mintFee)} CELO</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-bold">Total Cost:</span>
              <span className="font-bold">{formatEther(totalCost)} CELO</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isConfirming}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isConfirming ? 'Transaction pending...' : 'Mint Tokens'}
        </button>
      </form>
    </div>
  )
}

function getStageCap(stage: number): bigint {
  const caps = [0n, parseEther('1000'), parseEther('5000'), parseEther('25000'), parseEther('100000')]
  return caps[stage] || 0n
}
```

**Design Rationale**: Real-time calculation preview shows users exactly what they'll pay before submitting. Client-side validation catches errors early, reducing failed transactions. The breakdown of costs (collateral + fee) provides transparency. Toast notifications give immediate feedback on transaction status.

## Oracle API Integration

### Oracle API Route

**File: `app/api/oracle/calculate-aura/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import axios from 'axios'
import { z } from 'zod'

// Oracle constants matching oracle.js
const A_MIN = 0
const A_MAX = 200
const A_REF = 100

const WEIGHTS = {
  followers: 0.35,
  followerDelta: 0.25,
  avgLikes: 0.30,
  verification: 0.10
}

const NORM_PARAMS = {
  followers: { min: 10, max: 100000, scale: 200 },
  followerDelta: { min: -100, max: 1000, scale: 200 },
  avgLikes: { min: 1, max: 1000, scale: 200 }
}

const requestSchema = z.object({
  vaultAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid vault address'),
  farcasterUsername: z.string().min(1, 'Username required'),
  mockMode: z.boolean().optional().default(false)
})

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function normalizeLog(value: number, min: number, max: number, scale: number): number {
  if (value <= min) return 0
  if (value >= max) return scale

  const logMin = Math.log(min)
  const logMax = Math.log(max)
  const logValue = Math.log(value)

  const normalized = ((logValue - logMin) / (logMax - logMin)) * scale
  return clamp(normalized, 0, scale)
}

async function resolveFarcasterUsername(username: string, mockMode: boolean): Promise<string> {
  if (mockMode) {
    return '12345' // Mock FID
  }

  // Hardcoded for easier deployment and testing
  const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || '77632C4D-F144-4776-84DA-1A051A58F9E6'

  try {
    const response = await axios.get(
      `https://api.neynar.com/v2/farcaster/user/by_username?username=${username}`,
      { headers: { 'api_key': NEYNAR_API_KEY } }
    )

    const user = response.data.user
    if (!user) {
      throw new Error(`Username @${username} not found`)
    }

    return user.fid.toString()
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`Username @${username} not found on Farcaster`)
    }
    console.warn('Falling back to mock mode:', error.message)
    return resolveFarcasterUsername(username, true)
  }
}

async function fetchFarcasterMetrics(creatorFid: string, mockMode: boolean) {
  if (mockMode) {
    return {
      fid: creatorFid,
      followerCount: 5000,
      followerDelta: 150,
      avgLikes: 45,
      isVerified: true,
      timestamp: Date.now()
    }
  }

  // Hardcoded for easier deployment and testing
  const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || '77632C4D-F144-4776-84DA-1A051A58F9E6'

  try {
    const response = await axios.get(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${creatorFid}`,
      { headers: { 'api_key': NEYNAR_API_KEY } }
    )

    const user = response.data.users[0]
    if (!user) {
      throw new Error(`User with FID ${creatorFid} not found`)
    }

    const neynarScore = user.score || user.experimental?.neynar_user_score || 0
    const estimatedAvgLikes = Math.floor(neynarScore * 100)

    const followRatio = user.following_count > 0
      ? user.follower_count / user.following_count
      : user.follower_count

    const growthFactor = Math.min(neynarScore * followRatio * 0.01, 0.05)
    const followerDelta = Math.floor(user.follower_count * growthFactor)

    return {
      fid: creatorFid,
      followerCount: user.follower_count,
      followerDelta: followerDelta,
      avgLikes: estimatedAvgLikes,
      isVerified: user.power_badge || false,
      timestamp: Date.now(),
      username: user.username,
      displayName: user.display_name,
      neynarScore: neynarScore
    }
  } catch (error: any) {
    console.warn('Falling back to mock mode:', error.message)
    return fetchFarcasterMetrics(creatorFid, true)
  }
}

function computeAura(metrics: any): number {
  const normFollowers = normalizeLog(
    metrics.followerCount,
    NORM_PARAMS.followers.min,
    NORM_PARAMS.followers.max,
    NORM_PARAMS.followers.scale
  )

  const normFollowerDelta = normalizeLog(
    Math.max(1, metrics.followerDelta),
    1,
    NORM_PARAMS.followerDelta.max,
    NORM_PARAMS.followerDelta.scale
  )

  const normAvgLikes = normalizeLog(
    metrics.avgLikes,
    NORM_PARAMS.avgLikes.min,
    NORM_PARAMS.avgLikes.max,
    NORM_PARAMS.avgLikes.scale
  )

  const verificationBonus = metrics.isVerified ? WEIGHTS.verification * A_MAX : 0

  let spamPenalty = 0
  if (metrics.followerCount > 10000 && metrics.avgLikes < 10) {
    spamPenalty = 20
  }

  const aura =
    WEIGHTS.followers * normFollowers +
    WEIGHTS.followerDelta * normFollowerDelta +
    WEIGHTS.avgLikes * normAvgLikes +
    verificationBonus -
    spamPenalty

  return clamp(Math.floor(aura), A_MIN, A_MAX)
}

async function pinToIPFS(data: any): Promise<string> {
  // Hardcoded for easier deployment and testing
  const PINATA_JWT = process.env.PINATA_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjNWM3OGE3Yy0wZjA4LTQ3NWUtODg4Yy1lOWYxZTllNzk5ZGYiLCJlbWFpbCI6InBhdWxkZWJhbnNodTczQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJkY2MzMGUwYzY2OWIxZTUwMTA2MiIsInNjb3BlZEtleVNlY3JldCI6IjkxZjUyMjE0ZWFkYWU0NzE1M2QzNWQ5YjBkMzQ4MTQ1MThlYjU3OThlZmEyYmZjZjAzMjk0ZTE4ZGM2NTNkNzUiLCJleHAiOjE3OTI4Njk5NTJ9.yhShb0-tBW_QB9t4GS1HX2BZsLOvmbemGU78KE9n3uE'
  const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://indigo-naval-wolverine-789.mypinata.cloud'

  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: data,
        pinataMetadata: {
          name: `aurafi-metrics-${data.fid}-${data.timestamp}`
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const ipfsHash = response.data.IpfsHash
    return `${PINATA_GATEWAY}/ipfs/${ipfsHash}`
  } catch (error: any) {
    console.error('Error pinning to IPFS:', error.message)
    const mockHash = 'QmMockHash' + Date.now()
    return `${PINATA_GATEWAY}/ipfs/${mockHash}`
  }
}

async function updateVaultAura(vaultAddress: string, aura: number, ipfsUrl: string) {
  // Hardcoded for easier deployment and testing
  const RPC_URL = process.env.RPC_URL || 'http://localhost:8545'
  const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  const ORACLE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AURA_ORACLE_ADDRESS || '0x59b670e9fA9D0A427751Af201D676719a970857b'

  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider)

  // Load AuraOracle ABI (simplified for API route)
  const oracleAbi = [
    'function pushAura(address vault, uint256 aura, string memory ipfsHash) external',
    'function getAura(address vault) external view returns (uint256)'
  ]

  const oracleContract = new ethers.Contract(ORACLE_CONTRACT_ADDRESS, oracleAbi, wallet)

  // Extract IPFS hash from URL
  let ipfsHash: string
  if (ipfsUrl.includes('/ipfs/')) {
    ipfsHash = ipfsUrl.split('/ipfs/')[1]
  } else if (ipfsUrl.startsWith('ipfs://')) {
    ipfsHash = ipfsUrl.replace('ipfs://', '')
  } else {
    ipfsHash = ipfsUrl
  }

  const tx = await oracleContract.pushAura(vaultAddress, aura, ipfsHash)
  const receipt = await tx.wait()

  return {
    transactionHash: tx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vaultAddress, farcasterUsername, mockMode } = requestSchema.parse(body)

    // Step 1: Resolve username to FID
    const fid = await resolveFarcasterUsername(farcasterUsername, mockMode)

    // Step 2: Fetch metrics
    const metrics = await fetchFarcasterMetrics(fid, mockMode)

    // Step 3: Compute aura
    const aura = computeAura(metrics)

    // Step 4: Pin to IPFS
    const metricsData = {
      ...metrics,
      aura,
      computation: {
        weights: WEIGHTS,
        normParams: NORM_PARAMS,
        version: '1.0.0'
      }
    }
    const ipfsUrl = await pinToIPFS(metricsData)

    // Step 5: Update vault aura on-chain
    const txResult = await updateVaultAura(vaultAddress, aura, ipfsUrl)

    return NextResponse.json({
      success: true,
      aura,
      ipfsUrl,
      metrics: {
        fid,
        username: metrics.username,
        followerCount: metrics.followerCount,
        isVerified: metrics.isVerified
      },
      transaction: txResult
    })

  } catch (error: any) {
    console.error('Oracle API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to calculate aura'
      },
      { status: 500 }
    )
  }
}
```

**Design Rationale**: This API route replicates the exact functionality of oracle.js but as a Next.js API endpoint. It follows the same 5-step process: resolve username → fetch metrics → compute aura → pin to IPFS → update contract. Error handling ensures graceful fallbacks to mock data when external APIs fail. The route is stateless and can handle concurrent requests safely.


### Redeem Form Component

**File: `components/redeem-form.tsx`**

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWriteContract, useReadContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'sonner'
import { VAULT_ABI, TOKEN_ABI } from '@/lib/abis'
import { useUserPositions } from '@/hooks/use-user-positions'

const redeemSchema = z.object({
  quantity: z.string().refine(val => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, 'Quantity must be greater than 0'),
})

export function RedeemForm({ vault, userAddress, onSuccess }: RedeemFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(redeemSchema),
  })

  const { data: tokenBalance } = useReadContract({
    address: vault.tokenAddress,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
  })

  const { positions } = useUserPositions(vault.address, userAddress)
  const quantity = watch('quantity')
  const quantityBigInt = quantity ? parseEther(quantity) : 0n

  // Calculate estimated return using FIFO
  const estimatedReturn = calculateFifoReturn(positions, quantityBigInt)

  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const onSubmit = async (data: z.infer<typeof redeemSchema>) => {
    try {
      if (quantityBigInt > (tokenBalance || 0n)) {
        toast.error('Insufficient balance')
        return
      }

      // Check if redemption would drop health below 150%
      const newTotalSupply = vault.totalSupply - quantityBigInt
      const newHealth = (vault.totalCollateral * 100n) / (newTotalSupply * vault.peg)
      if (newHealth < 150n) {
        toast.error('Would drop health below 150%. Reduce quantity or add more collateral.')
        return
      }

      // Check allowance and approve if needed
      const { data: allowance } = await readContract({
        address: vault.tokenAddress,
        abi: TOKEN_ABI,
        functionName: 'allowance',
        args: [userAddress, vault.address],
      })

      if (allowance < quantityBigInt) {
        await writeContract({
          address: vault.tokenAddress,
          abi: TOKEN_ABI,
          functionName: 'approve',
          args: [vault.address, quantityBigInt],
        })
      }

      writeContract({
        address: vault.address,
        abi: VAULT_ABI,
        functionName: 'redeemTokens',
        args: [quantityBigInt],
      }, {
        onSuccess: () => {
          toast.success('Tokens redeemed successfully!')
          onSuccess()
        },
        onError: (error) => {
          toast.error(parseContractError(error))
        },
      })
    } catch (error) {
      toast.error('Transaction failed. Please try again.')
      console.error(error)
    }
  }

  if (!tokenBalance || tokenBalance === 0n) {
    return null
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Redeem Tokens</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Token Quantity
          </label>
          <input
            type="text"
            {...register('quantity')}
            className="w-full border rounded px-3 py-2"
            placeholder="0.0"
          />
          <p className="text-xs text-gray-600 mt-1">
            Balance: {formatEther(tokenBalance)} {vault.tokenSymbol}
          </p>
          {errors.quantity && (
            <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>
          )}
        </div>

        {quantity && (
          <div className="bg-gray-50 rounded p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Estimated Return:</span>
              <span className="font-semibold">{formatEther(estimatedReturn)} CELO</span>
            </div>
            <p className="text-xs text-gray-600">
              Positions are processed in FIFO order
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isConfirming}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {isConfirming ? 'Transaction pending...' : 'Redeem Tokens'}
        </button>
      </form>
    </div>
  )
}

function calculateFifoReturn(positions: Position[], quantity: bigint): bigint {
  let remaining = quantity
  let totalReturn = 0n

  for (const position of positions) {
    if (remaining === 0n) break
    
    const takeFromPosition = remaining > position.qty ? position.qty : remaining
    const returnAmount = (position.collateral * takeFromPosition) / position.qty
    
    totalReturn += returnAmount
    remaining -= takeFromPosition
  }

  return totalReturn
}
```

**Design Rationale**: FIFO calculation preview helps users understand exactly what they'll receive. The two-step approval + redeem flow is handled automatically, improving UX. Balance display prevents users from attempting to redeem more than they own.


### User Positions Component

**File: `components/user-positions.tsx`**

```typescript
'use client'

import { useUserPositions } from '@/hooks/use-user-positions'
import { formatEther } from 'viem'
import { format } from 'date-fns'

export function UserPositions({ vaultAddress, userAddress }: UserPositionsProps) {
  const { positions, isLoading } = useUserPositions(vaultAddress, userAddress)

  if (isLoading) {
    return <div>Loading positions...</div>
  }

  if (!positions || positions.length === 0) {
    return null
  }

  const activePositions = positions.filter(p => p.qty > 0n)

  if (activePositions.length === 0) {
    return null
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Your Positions</h3>
      <p className="text-sm text-gray-600 mb-4">
        Redemptions process in FIFO order (oldest first)
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left py-2">Position</th>
              <th className="text-right py-2">Tokens</th>
              <th className="text-right py-2">Collateral</th>
              <th className="text-right py-2">Stage</th>
              <th className="text-right py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {activePositions.map((position, index) => (
              <tr key={index} className="border-b last:border-0">
                <td className="py-3">#{index + 1}</td>
                <td className="text-right">{formatEther(position.qty)}</td>
                <td className="text-right">{formatEther(position.collateral)} CELO</td>
                <td className="text-right">{position.stageAtMint}</td>
                <td className="text-right">
                  {format(new Date(Number(position.timestamp) * 1000), 'MMM d, yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

**Design Rationale**: The table layout clearly shows FIFO order with visual numbering. Filtering out redeemed positions (qty = 0) keeps the view clean. Date formatting makes timestamps human-readable. The responsive table scrolls horizontally on mobile to preserve all columns.

### Bootstrap Form Component

**File: `components/bootstrap-form.tsx`**

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWriteContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'sonner'
import { VAULT_ABI } from '@/lib/abis'

const bootstrapSchema = z.object({
  amount: z.string().refine(val => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 100
  }, 'Minimum 100 CELO required to unlock Stage 1'),
})

export function BootstrapForm({ vaultAddress, onSuccess }: BootstrapFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(bootstrapSchema),
    defaultValues: { amount: '100' },
  })

  const { writeContract, isPending } = useWriteContract()

  const onSubmit = async (data: z.infer<typeof bootstrapSchema>) => {
    try {
      const amount = parseEther(data.amount)

      writeContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'bootstrapCreatorStake',
        value: amount,
      }, {
        onSuccess: () => {
          toast.success('Stage 1 unlocked!')
          onSuccess()
        },
        onError: (error) => {
          toast.error(parseContractError(error))
        },
      })
    } catch (error) {
      toast.error('Transaction failed. Please try again.')
      console.error(error)
    }
  }

  return (
    <div className="border rounded-lg p-6 bg-blue-50">
      <h3 className="text-xl font-bold mb-2">Bootstrap Vault</h3>
      <p className="text-sm text-gray-700 mb-4">
        Deposit 100 CELO to unlock Stage 1 and enable fan minting
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            CELO Amount
          </label>
          <input
            type="text"
            {...register('amount')}
            className="w-full border rounded px-3 py-2"
            placeholder="100"
          />
          {errors.amount && (
            <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isPending ? 'Transaction pending...' : 'Bootstrap Vault'}
        </button>
      </form>
    </div>
  )
}
```

**Design Rationale**: The blue background distinguishes this critical first step. Pre-filling with 100 CELO (minimum requirement) reduces friction. Clear messaging explains why bootstrapping is necessary.


### Stage Unlock Form Component

**File: `components/stage-unlock-form.tsx`**

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWriteContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'sonner'
import { VAULT_ABI } from '@/lib/abis'

const stageRequirements = [
  0n,
  parseEther('100'),   // Stage 1
  parseEther('500'),   // Stage 2
  parseEther('2500'),  // Stage 3
  parseEther('10000'), // Stage 4
]

const unlockSchema = z.object({
  amount: z.string().refine(val => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, 'Amount must be greater than 0'),
})

export function StageUnlockForm({ vault, onSuccess }: StageUnlockFormProps) {
  const nextStage = vault.stage + 1
  const nextStageRequirement = stageRequirements[nextStage]
  const remaining = nextStageRequirement - vault.creatorCollateral

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(unlockSchema),
    defaultValues: { amount: formatEther(remaining) },
  })

  const { writeContract, isPending } = useWriteContract()

  const onSubmit = async (data: z.infer<typeof unlockSchema>) => {
    try {
      const amount = parseEther(data.amount)

      if (vault.creatorCollateral + amount < nextStageRequirement) {
        toast.error(`Insufficient amount to unlock Stage ${nextStage}`)
        return
      }

      writeContract({
        address: vault.address,
        abi: VAULT_ABI,
        functionName: 'unlockStage',
        value: amount,
      }, {
        onSuccess: () => {
          toast.success(`Stage ${nextStage} unlocked!`)
          onSuccess()
        },
        onError: (error) => {
          toast.error(parseContractError(error))
        },
      })
    } catch (error) {
      toast.error('Transaction failed. Please try again.')
      console.error(error)
    }
  }

  if (vault.stage >= 4) {
    return null // Max stage reached
  }

  const progress = (Number(vault.creatorCollateral) / Number(nextStageRequirement)) * 100

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Stage Progression</h3>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Stage {vault.stage} → Stage {nextStage}</span>
          <span>{formatEther(vault.creatorCollateral)} / {formatEther(nextStageRequirement)} CELO</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            CELO Amount
          </label>
          <input
            type="text"
            {...register('amount')}
            className="w-full border rounded px-3 py-2"
            placeholder="0.0"
          />
          <p className="text-xs text-gray-600 mt-1">
            Remaining: {formatEther(remaining)} CELO
          </p>
          {errors.amount && (
            <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
        >
          {isPending ? 'Transaction pending...' : `Unlock Stage ${nextStage}`}
        </button>
      </form>
    </div>
  )
}
```

**Design Rationale**: The progress bar provides visual feedback on how close the creator is to the next stage. Pre-filling with the remaining amount reduces friction. Clear display of requirements helps creators plan their deposits.

### Forced Burn Alert Component

**File: `components/forced-burn-alert.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useWriteContract } from 'wagmi'
import { formatEther } from 'viem'
import { toast } from 'sonner'
import { VAULT_ABI } from '@/lib/abis'

export function ForcedBurnAlert({ vault, onExecuted }: ForcedBurnAlertProps) {
  const [timeRemaining, setTimeRemaining] = useState('')
  const { writeContract, isPending } = useWriteContract()

  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000)
      const deadline = Number(vault.forcedBurnDeadline)
      const remaining = deadline - now

      if (remaining <= 0) {
        setTimeRemaining('Grace period expired')
      } else {
        const hours = Math.floor(remaining / 3600)
        const minutes = Math.floor((remaining % 3600) / 60)
        setTimeRemaining(`${hours}h ${minutes}m remaining`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [vault.forcedBurnDeadline])

  const handleCheckForcedBurn = () => {
    writeContract({
      address: vault.address,
      abi: VAULT_ABI,
      functionName: 'checkAndTriggerForcedBurn',
    }, {
      onSuccess: () => {
        toast.success('Forced burn check completed')
        onExecuted()
      },
      onError: (error) => {
        toast.error(parseContractError(error))
      },
    })
  }

  return (
    <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-red-800 mb-2">
            ⚠️ Forced Burn Triggered
          </h3>
          <p className="text-sm text-red-700 mb-4">
            Supply exceeds cap due to aura drop. Tokens will be burned after grace period.
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex gap-4">
              <span className="text-red-700">Pending Burn:</span>
              <span className="font-semibold">{formatEther(vault.pendingForcedBurn)} tokens</span>
            </div>
            <div className="flex gap-4">
              <span className="text-red-700">New Supply Cap:</span>
              <span className="font-semibold">{formatEther(vault.supplyCap)} tokens</span>
            </div>
            <div className="flex gap-4">
              <span className="text-red-700">Grace Period:</span>
              <span className="font-semibold">{timeRemaining}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCheckForcedBurn}
          disabled={isPending}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
        >
          {isPending ? 'Checking...' : 'Check Forced Burn'}
        </button>
      </div>
    </div>
  )
}
```

**Design Rationale**: The red color scheme and warning icon immediately draw attention to this critical alert. The countdown timer updates every minute to show urgency. The "Check Forced Burn" button allows anyone to trigger the check, promoting protocol health.


### Vault Creation Page

**File: `app/create/page.tsx`**

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWriteContract, useWatchContractEvent, useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FACTORY_ABI } from '@/lib/abis'
import { getContractAddress } from '@/lib/config'

const createVaultSchema = z.object({
  name: z.string().min(1, 'Token name is required'),
  symbol: z.string().min(1, 'Token symbol is required'),
  baseCap: z.string().refine(val => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, 'Base capacity must be greater than 0'),
})

export default function CreateVaultPage() {
  const { address } = useAccount()
  const router = useRouter()
  const [newVaultAddress, setNewVaultAddress] = useState<string | null>(null)
  const [newTokenAddress, setNewTokenAddress] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createVaultSchema),
    defaultValues: { baseCap: '10000' },
  })

  const { writeContract, isPending } = useWriteContract()

  // Listen for VaultCreated event
  useWatchContractEvent({
    address: getContractAddress('VAULT_FACTORY'),
    abi: FACTORY_ABI,
    eventName: 'VaultCreated',
    onLogs: (logs) => {
      const log = logs[0]
      if (log.args.creator?.toLowerCase() === address?.toLowerCase()) {
        setNewVaultAddress(log.args.vault)
        setNewTokenAddress(log.args.token)
        toast.success('Vault created successfully!')
      }
    },
  })

  const onSubmit = async (data: z.infer<typeof createVaultSchema>) => {
    try {
      const baseCap = parseEther(data.baseCap)

      writeContract({
        address: getContractAddress('VAULT_FACTORY'),
        abi: FACTORY_ABI,
        functionName: 'createVault',
        args: [data.name, data.symbol, address, baseCap],
      }, {
        onError: (error) => {
          toast.error(parseContractError(error))
        },
      })
    } catch (error) {
      toast.error('Transaction failed. Please try again.')
      console.error(error)
    }
  }

  if (newVaultAddress) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            ✓ Vault Created Successfully!
          </h2>
          
          <div className="space-y-4 text-left bg-gray-50 rounded p-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Vault Address:</p>
              <p className="font-mono text-sm break-all">{newVaultAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Token Address:</p>
              <p className="font-mono text-sm break-all">{newTokenAddress}</p>
            </div>
          </div>

          <button
            onClick={() => router.push(`/vaults/${newVaultAddress}`)}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            Go to Vault
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create Creator Vault</h1>
      
      <div className="border rounded-lg p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Token Name
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full border rounded px-3 py-2"
              placeholder="My Creator Token"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Token Symbol
            </label>
            <input
              type="text"
              {...register('symbol')}
              className="w-full border rounded px-3 py-2"
              placeholder="MCT"
            />
            {errors.symbol && (
              <p className="text-red-600 text-sm mt-1">{errors.symbol.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Base Capacity (tokens)
            </label>
            <input
              type="text"
              {...register('baseCap')}
              className="w-full border rounded px-3 py-2"
              placeholder="10000"
            />
            <p className="text-xs text-gray-600 mt-1">
              Maximum supply at aura = 100. Scales with aura (0-200).
            </p>
            {errors.baseCap && (
              <p className="text-red-600 text-sm mt-1">{errors.baseCap.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isPending ? 'Deploying vault...' : 'Create Vault'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Design Rationale**: The event listener automatically detects when the vault is created and displays the success screen. Showing both vault and token addresses provides transparency. The "Go to Vault" button provides a clear next action. Form validation prevents empty or invalid inputs.


### Liquidation Page

**File: `app/liquidate/page.tsx`**

```typescript
'use client'

import { useVaults } from '@/hooks/use-vaults'
import { LiquidationCard } from '@/components/liquidation-card'

export default function LiquidatePage() {
  const { vaults, isLoading } = useVaults()

  const liquidatableVaults = vaults?.filter(v => v.health < 120) || []

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Liquidation Opportunities</h1>
      
      {liquidatableVaults.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-gray-600">
          <p>No vaults currently need liquidation</p>
          <p className="text-sm mt-2">Vaults with health below 120% will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liquidatableVaults.map(vault => (
            <LiquidationCard key={vault.address} vault={vault} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**File: `components/liquidation-card.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWriteContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'sonner'
import { VAULT_ABI } from '@/lib/abis'

const liquidateSchema = z.object({
  amount: z.string().refine(val => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0.01
  }, 'Minimum 0.01 CELO required'),
})

export function LiquidationCard({ vault }: LiquidationCardProps) {
  const [showForm, setShowForm] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(liquidateSchema),
  })

  const { writeContract, isPending } = useWriteContract()

  const amount = watch('amount')
  const amountBigInt = amount ? parseEther(amount) : 0n

  // Calculate liquidation preview
  const newTotalCollateral = vault.totalCollateral + amountBigInt
  const tokensToRemove = vault.totalSupply - (newTotalCollateral * 100n) / (vault.peg * 150n)
  const bounty = amountBigInt / 100n // 1%
  const creatorPenalty = vault.creatorCollateral / 10n // 10%
  const cappedPenalty = creatorPenalty > (amountBigInt * 20n) / 100n 
    ? (amountBigInt * 20n) / 100n 
    : creatorPenalty
  const newHealth = (newTotalCollateral * 100n) / ((vault.totalSupply - tokensToRemove) * vault.peg)

  const onSubmit = async (data: z.infer<typeof liquidateSchema>) => {
    try {
      const amount = parseEther(data.amount)

      if (newHealth < 150n) {
        toast.error('Amount insufficient to restore health to 150%')
        return
      }

      writeContract({
        address: vault.address,
        abi: VAULT_ABI,
        functionName: 'liquidate',
        value: amount,
      }, {
        onSuccess: () => {
          toast.success(`Liquidation successful! Earned ${formatEther(bounty)} CELO bounty`)
          setShowForm(false)
        },
        onError: (error) => {
          toast.error(parseContractError(error))
        },
      })
    } catch (error) {
      toast.error('Transaction failed. Please try again.')
      console.error(error)
    }
  }

  return (
    <div className="border-2 border-red-400 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{vault.tokenName}</h3>
          <p className="text-sm text-gray-600 font-mono">{vault.address.slice(0, 10)}...</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Health</p>
          <p className="text-2xl font-bold text-red-600">{vault.health.toFixed(0)}%</p>
        </div>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Creator:</span>
          <span className="font-mono">{vault.creator.slice(0, 10)}...</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Collateral:</span>
          <span>{formatEther(vault.totalCollateral)} CELO</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Supply:</span>
          <span>{formatEther(vault.totalSupply)} tokens</span>
        </div>
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        >
          Liquidate Vault
        </button>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              CELO Amount to Inject
            </label>
            <input
              type="text"
              {...register('amount')}
              className="w-full border rounded px-3 py-2"
              placeholder="0.0"
            />
            {errors.amount && (
              <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          {amount && (
            <div className="bg-gray-50 rounded p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tokens to Remove:</span>
                <span className="font-semibold">{formatEther(tokensToRemove)}</span>
              </div>
              <div className="flex justify-between">
                <span>Your Bounty (1%):</span>
                <span className="font-semibold text-green-600">{formatEther(bounty)} CELO</span>
              </div>
              <div className="flex justify-between">
                <span>Creator Penalty:</span>
                <span className="font-semibold">{formatEther(cappedPenalty)} CELO</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">Health After:</span>
                <span className="font-bold">{Number(newHealth).toFixed(0)}%</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border py-2 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              {isPending ? 'Liquidating...' : 'Execute Liquidation'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
```

**Design Rationale**: The liquidation page filters vaults automatically, showing only those needing intervention. The red border and health indicator make urgency clear. The liquidation preview shows all financial impacts (bounty, penalty, new health) before execution, ensuring informed decisions.

### Admin Panel Page

**File: `app/admin/page.tsx`**

```typescript
'use client'

import { useAccount, useReadContract } from 'wagmi'
import { useTreasuryBalance } from '@/hooks/use-treasury-balance'
import { useTreasuryEvents } from '@/hooks/use-treasury-events'
import { WithdrawalForm } from '@/components/withdrawal-form'
import { TreasuryStats } from '@/components/treasury-stats'
import { FeeHistoryTable } from '@/components/fee-history-table'
import { getContractAddress } from '@/lib/config'
import { TREASURY_ABI } from '@/lib/abis'
import { redirect } from 'next/navigation'

export default function AdminPage() {
  const { address } = useAccount()
  
  // Check if user is treasury owner
  const { data: owner } = useReadContract({
    address: getContractAddress('TREASURY'),
    abi: TREASURY_ABI,
    functionName: 'owner',
  })

  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase()

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">Connect your wallet to access the admin panel</p>
        </div>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h2>
          <p className="text-gray-600">You are not authorized to access the admin panel</p>
        </div>
      </div>
    )
  }

  const { balance, isLoading: balanceLoading, refetch } = useTreasuryBalance()
  const { events, isLoading: eventsLoading } = useTreasuryEvents()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Treasury Admin Panel</h1>
        <p className="text-gray-600">Manage protocol fees and withdrawals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TreasuryStats balance={balance} events={events} />
          <FeeHistoryTable events={events} isLoading={eventsLoading} />
        </div>

        <div>
          <WithdrawalForm 
            currentBalance={balance} 
            onSuccess={refetch}
            isLoading={balanceLoading}
          />
        </div>
      </div>
    </div>
  )
}
```

**File: `components/treasury-stats.tsx`**

```typescript
'use client'

import { formatEther } from 'viem'

interface TreasuryStatsProps {
  balance?: bigint
  events?: TreasuryEvent[]
}

export function TreasuryStats({ balance, events }: TreasuryStatsProps) {
  const totalCollected = events?.reduce((sum, e) => {
    if (e.type === 'collected') return sum + e.amount
    return sum
  }, 0n) || 0n

  const totalWithdrawn = events?.reduce((sum, e) => {
    if (e.type === 'withdrawn') return sum + e.amount
    return sum
  }, 0n) || 0n

  const collectionCount = events?.filter(e => e.type === 'collected').length || 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="border rounded-lg p-6 bg-green-50">
        <p className="text-sm text-gray-600 mb-1">Current Balance</p>
        <p className="text-3xl font-bold text-green-600">
          {balance ? formatEther(balance) : '0'} CELO
        </p>
      </div>

      <div className="border rounded-lg p-6">
        <p className="text-sm text-gray-600 mb-1">Total Collected</p>
        <p className="text-3xl font-bold">
          {formatEther(totalCollected)} CELO
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {collectionCount} transactions
        </p>
      </div>

      <div className="border rounded-lg p-6">
        <p className="text-sm text-gray-600 mb-1">Total Withdrawn</p>
        <p className="text-3xl font-bold">
          {formatEther(totalWithdrawn)} CELO
        </p>
      </div>
    </div>
  )
}
```

**File: `components/withdrawal-form.tsx`**

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther, isAddress } from 'viem'
import { toast } from 'sonner'
import { TREASURY_ABI } from '@/lib/abis'
import { getContractAddress } from '@/lib/config'

const withdrawalSchema = z.object({
  recipient: z.string().refine(val => isAddress(val), 'Invalid Ethereum address'),
  amount: z.string().refine(val => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, 'Amount must be greater than 0'),
})

interface WithdrawalFormProps {
  currentBalance?: bigint
  onSuccess: () => void
  isLoading: boolean
}

export function WithdrawalForm({ currentBalance, onSuccess, isLoading }: WithdrawalFormProps) {
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(withdrawalSchema),
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const amount = watch('amount')
  const amountBigInt = amount ? parseEther(amount) : 0n

  const onSubmit = async (data: z.infer<typeof withdrawalSchema>) => {
    try {
      const amount = parseEther(data.amount)

      if (currentBalance && amount > currentBalance) {
        toast.error('Insufficient treasury balance')
        return
      }

      writeContract({
        address: getContractAddress('TREASURY'),
        abi: TREASURY_ABI,
        functionName: 'withdraw',
        args: [data.recipient as `0x${string}`, amount],
      }, {
        onSuccess: () => {
          toast.success('Withdrawal successful!')
          reset()
          onSuccess()
        },
        onError: (error) => {
          toast.error(parseContractError(error))
        },
      })
    } catch (error) {
      toast.error('Transaction failed. Please try again.')
      console.error(error)
    }
  }

  const setMaxAmount = () => {
    if (currentBalance) {
      const maxAmount = formatEther(currentBalance)
      // Set the value manually since we can't use setValue with register
      const input = document.querySelector('input[name="amount"]') as HTMLInputElement
      if (input) input.value = maxAmount
    }
  }

  return (
    <div className="border rounded-lg p-6 bg-white sticky top-6">
      <h3 className="text-xl font-bold mb-4">Withdraw Funds</h3>
      
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading balance...</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-50 rounded p-4 mb-4">
            <p className="text-sm text-gray-600">Available Balance</p>
            <p className="text-2xl font-bold">
              {currentBalance ? formatEther(currentBalance) : '0'} CELO
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                {...register('recipient')}
                className="w-full border rounded px-3 py-2 font-mono text-sm"
                placeholder="0x..."
              />
              {errors.recipient && (
                <p className="text-red-600 text-sm mt-1">{errors.recipient.message}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">
                  Amount (CELO)
                </label>
                <button
                  type="button"
                  onClick={setMaxAmount}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Max
                </button>
              </div>
              <input
                type="text"
                {...register('amount')}
                className="w-full border rounded px-3 py-2"
                placeholder="0.0"
              />
              {errors.amount && (
                <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>

            {amount && currentBalance && amountBigInt > currentBalance && (
              <div className="bg-red-50 border border-red-400 rounded p-3">
                <p className="text-red-800 text-sm">
                  Amount exceeds available balance
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || isConfirming || (currentBalance && amountBigInt > currentBalance)}
              className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isPending || isConfirming ? 'Processing...' : 'Withdraw'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
```

**File: `components/fee-history-table.tsx`**

```typescript
'use client'

import { formatEther } from 'viem'
import { format } from 'date-fns'

interface TreasuryEvent {
  type: 'collected' | 'withdrawn'
  amount: bigint
  from?: string
  to?: string
  reason?: string
  timestamp: number
  txHash: string
}

interface FeeHistoryTableProps {
  events?: TreasuryEvent[]
  isLoading: boolean
}

export function FeeHistoryTable({ events, isLoading }: FeeHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Transaction History</h3>
        <p className="text-center text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className="border rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Transaction History</h3>
        <p className="text-center text-gray-600">No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Transaction History</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left py-2">Type</th>
              <th className="text-left py-2">Amount</th>
              <th className="text-left py-2">From/To</th>
              <th className="text-left py-2">Date</th>
              <th className="text-left py-2">Tx</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, index) => (
              <tr key={index} className="border-b last:border-0">
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    event.type === 'collected' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {event.type === 'collected' ? 'Fee Collected' : 'Withdrawn'}
                  </span>
                </td>
                <td className="font-semibold">
                  {formatEther(event.amount)} CELO
                </td>
                <td className="font-mono text-xs">
                  {event.type === 'collected' 
                    ? event.from?.slice(0, 10) + '...'
                    : event.to?.slice(0, 10) + '...'}
                </td>
                <td className="text-gray-600">
                  {format(new Date(event.timestamp * 1000), 'MMM d, yyyy HH:mm')}
                </td>
                <td>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${event.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-xs"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

**Design Rationale**: The admin panel is protected by owner-only access control. The treasury stats provide a clear overview of collected fees and withdrawals. The withdrawal form includes validation to prevent withdrawing more than available balance. The fee history table shows all treasury transactions with links to block explorer. The sticky withdrawal form stays visible while scrolling through history.


## Data Models

### TypeScript Interfaces

**File: `types/vault.ts`**

```typescript
export interface VaultState {
  address: string
  creator: string
  tokenAddress: string
  tokenName: string
  tokenSymbol: string
  creatorCollateral: bigint
  fanCollateral: bigint
  totalCollateral: bigint
  totalSupply: bigint
  stage: number
  aura: number
  peg: bigint
  supplyCap: bigint
  health: number
  tvl: bigint
  pendingForcedBurn: bigint
  forcedBurnDeadline: bigint
}

export interface Position {
  qty: bigint
  collateral: bigint
  stageAtMint: number
  timestamp: bigint
}

export interface VaultMetrics {
  totalVaults: number
  totalTVL: bigint
  averageHealth: number
  liquidatableCount: number
}
```

**Design Rationale**: Using bigint for all token amounts and CELO values prevents precision loss. Separating VaultState from Position allows efficient querying. The health field is calculated as a percentage for easier display.

### Contract ABI Types

**File: `lib/abis.ts`**

```typescript
export const VAULT_ABI = [
  {
    name: 'mintTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'qty', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'redeemTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'qty', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'bootstrapCreatorStake',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'unlockStage',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'liquidate',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'getVaultState',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'creatorCollateral', type: 'uint256' },
      { name: 'fanCollateral', type: 'uint256' },
      { name: 'totalSupply', type: 'uint256' },
      { name: 'stage', type: 'uint8' },
      { name: 'pendingForcedBurn', type: 'uint256' },
      { name: 'forcedBurnDeadline', type: 'uint256' },
    ],
  },
  {
    name: 'getPositionCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'fan', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getPosition',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'fan', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [
      { name: 'qty', type: 'uint256' },
      { name: 'collateral', type: 'uint256' },
      { name: 'stageAtMint', type: 'uint8' },
      { name: 'timestamp', type: 'uint256' },
    ],
  },
  // Events
  {
    name: 'Minted',
    type: 'event',
    inputs: [
      { name: 'fan', type: 'address', indexed: true },
      { name: 'qty', type: 'uint256', indexed: false },
      { name: 'collateral', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Redeemed',
    type: 'event',
    inputs: [
      { name: 'fan', type: 'address', indexed: true },
      { name: 'qty', type: 'uint256', indexed: false },
      { name: 'collateralReturned', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'StageUnlocked',
    type: 'event',
    inputs: [
      { name: 'newStage', type: 'uint8', indexed: false },
      { name: 'creatorCollateral', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'LiquidationExecuted',
    type: 'event',
    inputs: [
      { name: 'liquidator', type: 'address', indexed: true },
      { name: 'payment', type: 'uint256', indexed: false },
      { name: 'tokensRemoved', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'SupplyCapShrink',
    type: 'event',
    inputs: [
      { name: 'newCap', type: 'uint256', indexed: false },
      { name: 'pendingBurn', type: 'uint256', indexed: false },
      { name: 'deadline', type: 'uint256', indexed: false },
    ],
  },
] as const

export const FACTORY_ABI = [
  {
    name: 'createVault',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'creator', type: 'address' },
      { name: 'baseCap', type: 'uint256' },
    ],
    outputs: [
      { name: 'vault', type: 'address' },
      { name: 'token', type: 'address' },
    ],
  },
  {
    name: 'VaultCreated',
    type: 'event',
    inputs: [
      { name: 'vault', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
    ],
  },
] as const

export const ORACLE_ABI = [
  {
    name: 'getAura',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'vault', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'AuraUpdated',
    type: 'event',
    inputs: [
      { name: 'vault', type: 'address', indexed: true },
      { name: 'newAura', type: 'uint256', indexed: false },
      { name: 'evidenceIPFS', type: 'string', indexed: false },
    ],
  },
] as const

export const TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

export const TREASURY_ABI = [
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'getBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'TreasuryCollected',
    type: 'event',
    inputs: [
      { name: 'vault', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'reason', type: 'string', indexed: false },
    ],
  },
  {
    name: 'Withdrawn',
    type: 'event',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const
```

**Design Rationale**: Using TypeScript's `as const` ensures type inference for ABI types. Including only the functions and events we actually use keeps the bundle size small. Separating ABIs by contract improves maintainability. The Treasury ABI includes owner check, balance query, withdrawal function, and events for tracking fee collection and withdrawals.


### Custom Hooks

**File: `hooks/use-vaults.ts`**

```typescript
'use client'

import { useReadContract, useWatchContractEvent } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FACTORY_ABI, VAULT_ABI, ORACLE_ABI } from '@/lib/abis'
import { getContractAddress } from '@/lib/config'
import type { VaultState } from '@/types/vault'

export function useVaults() {
  const queryClient = useQueryClient()

  // Fetch all VaultCreated events
  const { data: vaultAddresses } = useReadContract({
    address: getContractAddress('VAULT_FACTORY'),
    abi: FACTORY_ABI,
    functionName: 'getAllVaults', // Assuming factory has this view function
  })

  // Watch for new vaults
  useWatchContractEvent({
    address: getContractAddress('VAULT_FACTORY'),
    abi: FACTORY_ABI,
    eventName: 'VaultCreated',
    onLogs: () => {
      queryClient.invalidateQueries({ queryKey: ['vaults'] })
    },
  })

  // Fetch state for each vault
  const { data: vaults, isLoading } = useQuery({
    queryKey: ['vaults', vaultAddresses],
    queryFn: async () => {
      if (!vaultAddresses) return []

      const vaultStates = await Promise.all(
        vaultAddresses.map(async (address) => {
          const state = await fetchVaultState(address)
          return state
        })
      )

      return vaultStates
    },
    enabled: !!vaultAddresses,
  })

  return { vaults, isLoading }
}

async function fetchVaultState(address: string): Promise<VaultState> {
  // Fetch vault state, aura, and calculate derived values
  // Implementation details...
}
```

**File: `hooks/use-vault-state.ts`**

```typescript
'use client'

import { useReadContract, useWatchContractEvent } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { VAULT_ABI, ORACLE_ABI } from '@/lib/abis'
import { getContractAddress } from '@/lib/config'
import type { VaultState } from '@/types/vault'

export function useVaultState(vaultAddress: string) {
  const queryClient = useQueryClient()

  // Watch for vault events
  useWatchContractEvent({
    address: vaultAddress,
    abi: VAULT_ABI,
    eventName: 'Minted',
    onLogs: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', vaultAddress] })
    },
  })

  useWatchContractEvent({
    address: vaultAddress,
    abi: VAULT_ABI,
    eventName: 'Redeemed',
    onLogs: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', vaultAddress] })
    },
  })

  useWatchContractEvent({
    address: vaultAddress,
    abi: VAULT_ABI,
    eventName: 'StageUnlocked',
    onLogs: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', vaultAddress] })
    },
  })

  useWatchContractEvent({
    address: getContractAddress('AURA_ORACLE'),
    abi: ORACLE_ABI,
    eventName: 'AuraUpdated',
    onLogs: (logs) => {
      const log = logs.find(l => l.args.vault?.toLowerCase() === vaultAddress.toLowerCase())
      if (log) {
        queryClient.invalidateQueries({ queryKey: ['vault', vaultAddress] })
      }
    },
  })

  // Fetch vault state
  const { data: vault, isLoading, refetch } = useQuery({
    queryKey: ['vault', vaultAddress],
    queryFn: async () => {
      const [vaultState, aura, tokenInfo] = await Promise.all([
        readContract({
          address: vaultAddress,
          abi: VAULT_ABI,
          functionName: 'getVaultState',
        }),
        readContract({
          address: getContractAddress('AURA_ORACLE'),
          abi: ORACLE_ABI,
          functionName: 'getAura',
          args: [vaultAddress],
        }),
        // Fetch token name/symbol
      ])

      // Calculate peg and supply cap
      const peg = calculatePeg(aura)
      const supplyCap = calculateSupplyCap(baseCap, aura)
      const totalCollateral = vaultState.creatorCollateral + vaultState.fanCollateral
      const health = (totalCollateral * 100n) / (vaultState.totalSupply * peg)

      return {
        address: vaultAddress,
        ...vaultState,
        aura,
        peg,
        supplyCap,
        health: Number(health),
        tvl: totalCollateral,
      } as VaultState
    },
    refetchInterval: 10000, // Poll every 10 seconds
  })

  return { vault, isLoading, refetch }
}

function calculatePeg(aura: number): bigint {
  // Peg = 0.3 + 2.7 * (aura / 200)
  const pegFloat = 0.3 + 2.7 * (aura / 200)
  return parseEther(pegFloat.toString())
}

function calculateSupplyCap(baseCap: bigint, aura: number): bigint {
  // Cap = BaseCap * (1 + 0.75 * (aura - 100) / 100)
  const multiplier = 1 + 0.75 * ((aura - 100) / 100)
  return (baseCap * BigInt(Math.floor(multiplier * 1000))) / 1000n
}
```

**File: `hooks/use-user-positions.ts`**

```typescript
'use client'

import { useReadContract } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { VAULT_ABI } from '@/lib/abis'
import type { Position } from '@/types/vault'

export function useUserPositions(vaultAddress: string, userAddress?: string) {
  const { data: positionCount } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'getPositionCount',
    args: [userAddress],
    query: { enabled: !!userAddress },
  })

  const { data: positions, isLoading } = useQuery({
    queryKey: ['positions', vaultAddress, userAddress],
    queryFn: async () => {
      if (!positionCount || !userAddress) return []

      const positions = await Promise.all(
        Array.from({ length: Number(positionCount) }, (_, i) =>
          readContract({
            address: vaultAddress,
            abi: VAULT_ABI,
            functionName: 'getPosition',
            args: [userAddress, BigInt(i)],
          })
        )
      )

      return positions.map((p, i) => ({
        qty: p.qty,
        collateral: p.collateral,
        stageAtMint: p.stageAtMint,
        timestamp: p.timestamp,
      })) as Position[]
    },
    enabled: !!positionCount && !!userAddress,
  })

  return { positions, isLoading }
}
```

**File: `hooks/use-creator-vaults.ts`**

```typescript
'use client'

import { useVaults } from './use-vaults'
import { useMemo } from 'react'

export function useCreatorVaults(creatorAddress?: string) {
  const { vaults, isLoading } = useVaults()

  const creatorVaults = useMemo(() => {
    if (!vaults || !creatorAddress) return []
    return vaults.filter(
      v => v.creator.toLowerCase() === creatorAddress.toLowerCase()
    )
  }, [vaults, creatorAddress])

  const stats = useMemo(() => {
    if (!creatorVaults.length) return null

    const totalTVL = creatorVaults.reduce((sum, v) => sum + v.tvl, 0n)
    const totalSupply = creatorVaults.reduce((sum, v) => sum + v.totalSupply, 0n)
    const averageHealth = creatorVaults.reduce((sum, v) => sum + v.health, 0) / creatorVaults.length

    return {
      totalVaults: creatorVaults.length,
      totalTVL,
      totalSupply,
      averageHealth,
    }
  }, [creatorVaults])

  return { vaults: creatorVaults, isLoading, stats }
}
```

**File: `hooks/use-all-fan-positions.ts`**

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { readContract } from 'wagmi/actions'
import { VAULT_ABI } from '@/lib/abis'

export function useAllFanPositions(vaultAddress: string) {
  const { data: positions, isLoading } = useQuery({
    queryKey: ['all-fan-positions', vaultAddress],
    queryFn: async () => {
      // This would require a contract function that returns all fan addresses
      // For now, we'll return empty array as this needs contract support
      // In production, you'd fetch FanMinted events and aggregate
      return []
    },
  })

  return { positions, isLoading }
}
```

**File: `hooks/use-treasury-balance.ts`**

```typescript
'use client'

import { useReadContract, useWatchContractEvent } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { TREASURY_ABI } from '@/lib/abis'
import { getContractAddress } from '@/lib/config'

export function useTreasuryBalance() {
  const queryClient = useQueryClient()

  // Watch for treasury events
  useWatchContractEvent({
    address: getContractAddress('TREASURY'),
    abi: TREASURY_ABI,
    eventName: 'TreasuryCollected',
    onLogs: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury-balance'] })
    },
  })

  useWatchContractEvent({
    address: getContractAddress('TREASURY'),
    abi: TREASURY_ABI,
    eventName: 'Withdrawn',
    onLogs: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury-balance'] })
    },
  })

  const { data: balance, isLoading, refetch } = useReadContract({
    address: getContractAddress('TREASURY'),
    abi: TREASURY_ABI,
    functionName: 'getBalance',
    query: {
      queryKey: ['treasury-balance'],
      refetchInterval: 10000, // Poll every 10 seconds
    },
  })

  return { balance, isLoading, refetch }
}
```

**File: `hooks/use-treasury-events.ts`**

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { getContractAddress } from '@/lib/config'
import { TREASURY_ABI } from '@/lib/abis'
import { publicClient } from '@/lib/viem-client'

interface TreasuryEvent {
  type: 'collected' | 'withdrawn'
  amount: bigint
  from?: string
  to?: string
  reason?: string
  timestamp: number
  txHash: string
}

export function useTreasuryEvents() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['treasury-events'],
    queryFn: async () => {
      const treasuryAddress = getContractAddress('TREASURY')

      // Fetch TreasuryCollected events
      const collectedLogs = await publicClient.getLogs({
        address: treasuryAddress,
        event: TREASURY_ABI.find(item => item.name === 'TreasuryCollected'),
        fromBlock: 'earliest',
        toBlock: 'latest',
      })

      // Fetch Withdrawn events
      const withdrawnLogs = await publicClient.getLogs({
        address: treasuryAddress,
        event: TREASURY_ABI.find(item => item.name === 'Withdrawn'),
        fromBlock: 'earliest',
        toBlock: 'latest',
      })

      // Combine and format events
      const allEvents: TreasuryEvent[] = []

      for (const log of collectedLogs) {
        const block = await publicClient.getBlock({ blockHash: log.blockHash })
        allEvents.push({
          type: 'collected',
          amount: log.args.amount,
          from: log.args.vault,
          reason: log.args.reason,
          timestamp: Number(block.timestamp),
          txHash: log.transactionHash,
        })
      }

      for (const log of withdrawnLogs) {
        const block = await publicClient.getBlock({ blockHash: log.blockHash })
        allEvents.push({
          type: 'withdrawn',
          amount: log.args.amount,
          to: log.args.to,
          timestamp: Number(block.timestamp),
          txHash: log.transactionHash,
        })
      }

      // Sort by timestamp descending (newest first)
      return allEvents.sort((a, b) => b.timestamp - a.timestamp)
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  return { events, isLoading }
}
```

**Design Rationale**: Custom hooks encapsulate complex data fetching logic and provide a clean API to components. TanStack Query handles caching, deduplication, and background refetching. Event watchers invalidate queries automatically, ensuring real-time updates. The 10-second polling interval provides a fallback for missed events. useCreatorVaults filters vaults by creator and calculates aggregate stats. useAllFanPositions would fetch all fan positions for creator analytics (requires contract support or event indexing). useTreasuryBalance tracks the current treasury balance with real-time updates. useTreasuryEvents fetches and formats all treasury events (collected fees and withdrawals) for the history table.


## Error Handling

### Contract Error Parsing

**File: `lib/error-parser.ts`**

```typescript
export function parseContractError(error: any): string {
  const errorMessage = error?.message || error?.toString() || ''

  // Map contract revert reasons to user-friendly messages
  const errorMap: Record<string, string> = {
    'InsufficientCollateral': 'Not enough CELO. Please add more collateral.',
    'StageNotUnlocked': 'Vault not bootstrapped. Creator must deposit 100 CELO first.',
    'ExceedsStageCap': 'Stage capacity reached. Wait for creator to unlock next stage.',
    'ExceedsSupplyCap': 'Supply cap reached due to low aura. Wait for aura to increase.',
    'HealthTooLow': 'This action would drop vault health below 150%. Reduce quantity or add more collateral.',
    'NotLiquidatable': 'Vault health is above 120%. Liquidation not needed.',
    'InsufficientAllowance': 'Token approval required. Please approve tokens first.',
    'InvalidAmount': 'Invalid amount. Please check your input.',
    'Unauthorized': 'You are not authorized to perform this action.',
    'VaultNotFound': 'Vault does not exist.',
    'user rejected': 'Transaction cancelled by user.',
    'insufficient funds': 'Insufficient CELO balance in your wallet.',
  }

  // Check for known error patterns
  for (const [pattern, message] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return message
    }
  }

  // Default error message
  return 'Transaction failed. Please try again.'
}
```

**Design Rationale**: Centralized error parsing ensures consistent error messages across the app. User-friendly messages hide technical details while providing actionable guidance. The error map is easily extensible as new error cases are discovered.

### Error Boundary Component

**File: `components/error-boundary.tsx`**

```typescript
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
              <p className="text-gray-600 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
```

**Design Rationale**: Error boundaries catch React rendering errors and prevent the entire app from crashing. The fallback UI provides a clear error message and recovery option (reload). Errors are logged to console for debugging.

### Network Error Handling

**File: `hooks/use-network-config.ts`**

```typescript
'use client'

import { useAccount, useChainId } from 'wagmi'
import { anvil, sepolia } from 'wagmi/chains'

export function useNetworkConfig() {
  const chainId = useChainId()
  const { isConnected } = useAccount()

  const targetNetwork = process.env.NEXT_PUBLIC_NETWORK || 'anvil'
  const targetChain = targetNetwork === 'sepolia' ? sepolia : anvil

  const isWrongNetwork = isConnected && chainId !== targetChain.id

  return {
    targetChain,
    isWrongNetwork,
    currentChainId: chainId,
  }
}
```

**Design Rationale**: Centralized network configuration makes it easy to detect wrong network state. The hook provides all network-related state in one place, simplifying component logic.

### Toast Notification Strategy

**File: `lib/toast-config.ts`**

```typescript
import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message, {
      duration: 5000,
      position: 'top-right',
    })
  },
  error: (message: string) => {
    sonnerToast.error(message, {
      duration: 5000,
      position: 'top-right',
    })
  },
  loading: (message: string) => {
    return sonnerToast.loading(message, {
      position: 'top-right',
    })
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      position: 'top-right',
    })
  },
}
```

**Design Rationale**: Wrapping Sonner's toast API provides consistent configuration across the app. The 5-second auto-dismiss prevents notification buildup. Top-right positioning is standard and non-intrusive.

### Additional Components for Separate Views

**File: `components/creator-stats.tsx`**

```typescript
'use client'

interface CreatorStatsProps {
  stats: {
    totalVaults: number
    totalTVL: bigint
    totalSupply: bigint
    averageHealth: number
  }
}

export function CreatorStats({ stats }: CreatorStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-600">Total Vaults</p>
        <p className="text-2xl font-bold">{stats.totalVaults}</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-600">Total TVL</p>
        <p className="text-2xl font-bold">{formatEther(stats.totalTVL)} CELO</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-600">Total Supply</p>
        <p className="text-2xl font-bold">{formatEther(stats.totalSupply)}</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-600">Avg Health</p>
        <p className="text-2xl font-bold">{stats.averageHealth.toFixed(0)}%</p>
      </div>
    </div>
  )
}
```

**File: `components/fan-vault-metrics.tsx`**

```typescript
'use client'

import { formatEther } from 'viem'

export function FanVaultMetrics({ vault }: { vault: VaultState }) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Vault Metrics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Token Price</p>
          <p className="text-lg font-semibold">{formatEther(vault.peg)} CELO</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Value Locked</p>
          <p className="text-lg font-semibold">{formatEther(vault.tvl)} CELO</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Supply</p>
          <p className="text-lg font-semibold">{formatEther(vault.totalSupply)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Supply Cap</p>
          <p className="text-lg font-semibold">{formatEther(vault.supplyCap)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Vault Health</p>
          <p className={`text-lg font-semibold ${getHealthColor(vault.health)}`}>
            {vault.health.toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Aura Score</p>
          <p className="text-lg font-semibold">{vault.aura}/200</p>
        </div>
      </div>
    </div>
  )
}
```

**File: `components/creator-vault-metrics.tsx`**

```typescript
'use client'

import { formatEther } from 'viem'

export function CreatorVaultMetrics({ vault }: { vault: VaultState }) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Vault Overview</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Your Collateral</p>
          <p className="text-lg font-semibold">{formatEther(vault.creatorCollateral)} CELO</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Fan Collateral</p>
          <p className="text-lg font-semibold">{formatEther(vault.fanCollateral)} CELO</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Collateral</p>
          <p className="text-lg font-semibold">{formatEther(vault.totalCollateral)} CELO</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Supply</p>
          <p className="text-lg font-semibold">{formatEther(vault.totalSupply)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Current Stage</p>
          <p className="text-lg font-semibold">{vault.stage}/4</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Vault Health</p>
          <p className={`text-lg font-semibold ${getHealthColor(vault.health)}`}>
            {vault.health.toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Aura Score</p>
          <p className="text-lg font-semibold">{vault.aura}/200</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Token Peg</p>
          <p className="text-lg font-semibold">{formatEther(vault.peg)} CELO</p>
        </div>
      </div>
    </div>
  )
}
```

**File: `components/aura-chart.tsx`**

```typescript
'use client'

export function AuraChart({ vaultAddress, currentAura }: { vaultAddress: string, currentAura: number }) {
  // Simple visual gauge for aura (0-200)
  const percentage = (currentAura / 200) * 100
  
  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Aura Score</h3>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-4 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <div className="text-2xl font-bold">{currentAura}/200</div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>Aura reflects creator engagement and determines token price and supply cap.</p>
        <p className="mt-2">
          Current peg: <span className="font-semibold">0.3 + 2.7 × ({currentAura}/200) CELO</span>
        </p>
      </div>
    </div>
  )
}
```

**File: `components/vault-analytics.tsx`**

```typescript
'use client'

export function VaultAnalytics({ vault }: { vault: VaultState }) {
  const collateralRatio = vault.totalCollateral > 0n 
    ? (Number(vault.creatorCollateral) / Number(vault.totalCollateral)) * 100 
    : 0

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Analytics</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Collateral Breakdown</span>
          </div>
          <div className="flex gap-2">
            <div 
              className="bg-purple-600 h-8 rounded flex items-center justify-center text-white text-xs"
              style={{ width: `${collateralRatio}%` }}
            >
              Creator {collateralRatio.toFixed(0)}%
            </div>
            <div 
              className="bg-blue-600 h-8 rounded flex items-center justify-center text-white text-xs"
              style={{ width: `${100 - collateralRatio}%` }}
            >
              Fans {(100 - collateralRatio).toFixed(0)}%
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-600">Capacity Used</p>
            <p className="text-lg font-semibold">
              {((Number(vault.totalSupply) / Number(vault.supplyCap)) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Available to Mint</p>
            <p className="text-lg font-semibold">
              {formatEther(vault.supplyCap - vault.totalSupply)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**File: `components/fan-positions-list.tsx`**

```typescript
'use client'

import { useAllFanPositions } from '@/hooks/use-all-fan-positions'
import { formatEther } from 'viem'

export function FanPositionsList({ vaultAddress }: { vaultAddress: string }) {
  const { positions, isLoading } = useAllFanPositions(vaultAddress)

  if (isLoading) {
    return <div>Loading fan positions...</div>
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="border rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Fan Positions</h3>
        <p className="text-gray-600 text-center">No fan positions yet</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Fan Positions</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left py-2">Fan</th>
              <th className="text-right py-2">Tokens</th>
              <th className="text-right py-2">Collateral</th>
              <th className="text-right py-2">Stage</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position, index) => (
              <tr key={index} className="border-b last:border-0">
                <td className="py-3 font-mono">{formatAddress(position.fan)}</td>
                <td className="text-right">{formatEther(position.qty)}</td>
                <td className="text-right">{formatEther(position.collateral)} CELO</td>
                <td className="text-right">{position.stageAtMint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

**Design Rationale**: Separate components for fan and creator views ensure each role sees relevant information. CreatorStats provides aggregate metrics across all vaults. FanVaultMetrics emphasizes investment data. CreatorVaultMetrics shows management data. AuraChart visualizes engagement. VaultAnalytics shows collateral breakdown. FanPositionsList helps creators see who's invested.


## Testing Strategy

### Unit Testing Approach

**Testing Framework:**
- Vitest for unit tests (fast, Vite-native)
- React Testing Library for component tests
- wagmi test utilities for mocking Web3 interactions

**Test Coverage Priorities:**
1. **Utility Functions** (100% coverage target)
   - `calculatePeg()` - Verify peg calculation across aura range (0-200)
   - `calculateSupplyCap()` - Verify supply cap scaling
   - `calculateFifoReturn()` - Verify FIFO redemption logic
   - `parseContractError()` - Verify all error mappings
   - `formatAddress()` - Verify address truncation

2. **Custom Hooks** (Core logic coverage)
   - `useVaultState` - Mock contract calls, verify state aggregation
   - `useUserPositions` - Mock position fetching, verify FIFO ordering
   - `useNetworkConfig` - Verify network detection logic

3. **Form Validation** (Schema coverage)
   - Mint form - Test quantity validation, cost calculation
   - Redeem form - Test balance checks, health validation
   - Create vault form - Test name/symbol/baseCap validation

**Example Test:**

```typescript
// __tests__/lib/calculations.test.ts
import { describe, it, expect } from 'vitest'
import { calculatePeg, calculateSupplyCap } from '@/lib/calculations'
import { parseEther } from 'viem'

describe('calculatePeg', () => {
  it('should return 0.3 CELO at aura = 0', () => {
    const peg = calculatePeg(0)
    expect(peg).toBe(parseEther('0.3'))
  })

  it('should return 1.65 CELO at aura = 100', () => {
    const peg = calculatePeg(100)
    expect(peg).toBe(parseEther('1.65'))
  })

  it('should return 3.0 CELO at aura = 200', () => {
    const peg = calculatePeg(200)
    expect(peg).toBe(parseEther('3.0'))
  })
})

describe('calculateSupplyCap', () => {
  it('should return 25% of baseCap at aura = 0', () => {
    const baseCap = parseEther('10000')
    const cap = calculateSupplyCap(baseCap, 0)
    expect(cap).toBe(parseEther('2500'))
  })

  it('should return baseCap at aura = 100', () => {
    const baseCap = parseEther('10000')
    const cap = calculateSupplyCap(baseCap, 100)
    expect(cap).toBe(baseCap)
  })

  it('should return 175% of baseCap at aura = 200', () => {
    const baseCap = parseEther('10000')
    const cap = calculateSupplyCap(baseCap, 200)
    expect(cap).toBe(parseEther('17500'))
  })
})
```

**Design Rationale**: Unit tests focus on pure functions and business logic, which are easiest to test and most critical. Mocking Web3 interactions prevents flaky tests and allows fast execution. Testing edge cases (aura = 0, 100, 200) ensures correctness across the full range.

### Integration Testing Approach

**Testing Strategy:**
- Playwright for end-to-end tests
- Test against local Anvil instance with deployed contracts
- Focus on critical user flows

**Critical Flows to Test:**
1. **Creator Flow**
   - Connect wallet → Create vault → Bootstrap → Unlock stages
   - Verify vault appears in browse page
   - Verify stage progression UI updates

2. **Fan Flow**
   - Connect wallet → Browse vaults → View vault detail
   - Mint tokens → Verify position created
   - Redeem tokens → Verify CELO returned

3. **Liquidator Flow**
   - Browse liquidation page → Find undercollateralized vault
   - Execute liquidation → Verify bounty received
   - Verify vault health restored

**Example E2E Test:**

```typescript
// e2e/creator-flow.spec.ts
import { test, expect } from '@playwright/test'

test('creator can create and bootstrap vault', async ({ page }) => {
  // Connect wallet (using test wallet)
  await page.goto('http://localhost:3000')
  await page.click('text=Connect Wallet')
  await page.click('text=MetaMask')
  
  // Create vault
  await page.goto('http://localhost:3000/create')
  await page.fill('input[name="name"]', 'Test Creator Token')
  await page.fill('input[name="symbol"]', 'TCT')
  await page.fill('input[name="baseCap"]', '10000')
  await page.click('button:has-text("Create Vault")')
  
  // Wait for transaction
  await page.waitForSelector('text=Vault Created Successfully')
  
  // Navigate to vault
  await page.click('text=Go to Vault')
  
  // Bootstrap vault
  await page.fill('input[name="amount"]', '100')
  await page.click('button:has-text("Bootstrap Vault")')
  
  // Wait for transaction
  await page.waitForSelector('text=Stage 1 unlocked!')
  
  // Verify stage updated
  await expect(page.locator('text=Stage 1')).toBeVisible()
})
```

**Design Rationale**: E2E tests validate the entire stack including UI, Web3 interactions, and smart contracts. Testing against Anvil provides a controlled environment with predictable state. Focusing on critical flows ensures core functionality works end-to-end.

### Manual Testing Checklist

**Pre-Deployment Checklist:**
- [ ] Wallet connection works with MetaMask, WalletConnect
- [ ] Network switching works (Anvil ↔ Sepolia)
- [ ] All forms validate inputs correctly
- [ ] Transaction errors display user-friendly messages
- [ ] Real-time updates work (polling + events)
- [ ] Mobile responsive design works on phone/tablet
- [ ] Loading states display correctly
- [ ] Toast notifications appear and dismiss
- [ ] Contract addresses load from environment variables
- [ ] Wrong network warning displays correctly

**Design Rationale**: Manual testing catches UI/UX issues that automated tests miss. The checklist ensures consistent testing across deployments. Pre-deployment validation prevents shipping broken features.

### Performance Testing

**Metrics to Monitor:**
- Initial page load time (target: < 2s)
- Time to interactive (target: < 3s)
- RPC call frequency (target: < 10 calls/minute per user)
- Bundle size (target: < 500KB gzipped)

**Optimization Strategies:**
1. **Code Splitting** - Lazy load vault detail page and liquidation page
2. **Query Deduplication** - TanStack Query prevents duplicate RPC calls
3. **Polling Optimization** - 10-second interval balances freshness and load
4. **Event Batching** - Debounce rapid event invalidations

**Design Rationale**: Performance directly impacts user experience and RPC costs. Monitoring key metrics ensures the app stays fast as features are added. Optimization strategies are implemented proactively based on known bottlenecks.


## Deployment and Configuration

### Environment Configuration

**Local Development (.env.local):**
```bash
NEXT_PUBLIC_NETWORK=anvil
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_AURA_ORACLE_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_TREASURY_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

**Sepolia Testnet (.env.production):**
```bash
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=<deployed-factory-address>
NEXT_PUBLIC_AURA_ORACLE_ADDRESS=<deployed-oracle-address>
NEXT_PUBLIC_TREASURY_ADDRESS=<deployed-treasury-address>
```

**Configuration Validation:**

```typescript
// lib/config.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_NETWORK',
  'NEXT_PUBLIC_RPC_URL',
  'NEXT_PUBLIC_VAULT_FACTORY_ADDRESS',
  'NEXT_PUBLIC_AURA_ORACLE_ADDRESS',
  'NEXT_PUBLIC_TREASURY_ADDRESS',
]

export function validateConfig() {
  const missing = requiredEnvVars.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }

  // Validate addresses are not placeholders
  const addresses = [
    process.env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS,
    process.env.NEXT_PUBLIC_AURA_ORACLE_ADDRESS,
    process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
  ]

  const invalidAddresses = addresses.filter(
    addr => !addr || addr === '0x0000000000000000000000000000000000000000'
  )

  if (invalidAddresses.length > 0) {
    throw new Error('Contract addresses not configured')
  }
}

export function getContractAddress(contract: 'VAULT_FACTORY' | 'AURA_ORACLE' | 'TREASURY'): string {
  const envKey = `NEXT_PUBLIC_${contract}_ADDRESS`
  return process.env[envKey] as string
}
```

**Design Rationale**: Environment variables allow configuration without code changes. Validation at startup prevents runtime errors from misconfiguration. The getContractAddress helper provides type-safe access to addresses.

### Deployment Process

**Local Development:**
1. Start Anvil: `anvil`
2. Deploy contracts: `forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast`
3. Copy deployed addresses to `.env.local`
4. Start frontend: `npm run dev`

**Sepolia Deployment:**
1. Deploy contracts to Sepolia
2. Update `.env.production` with deployed addresses
3. Build frontend: `npm run build`
4. Deploy to Vercel/Netlify: `vercel deploy --prod`

**Design Rationale**: The deployment process is streamlined for both local and testnet. Separating contract deployment from frontend deployment allows independent updates. Using Vercel/Netlify provides automatic CI/CD and preview deployments.

### Monitoring and Observability

**Error Tracking:**
- Sentry for production error tracking
- Console logging for development

**Analytics:**
- Track key user actions (vault creation, minting, redemption)
- Monitor transaction success/failure rates
- Track wallet connection rates

**RPC Monitoring:**
- Monitor RPC call frequency
- Track failed RPC calls
- Alert on rate limit errors

**Design Rationale**: Monitoring provides visibility into production issues and user behavior. Error tracking helps quickly identify and fix bugs. RPC monitoring prevents rate limit issues and optimizes costs.

## Security Considerations

### Input Validation

**Client-Side Validation:**
- All numeric inputs validated with Zod schemas
- Address inputs validated with viem's `isAddress()`
- Amount inputs checked against user balances before submission

**Design Rationale**: Client-side validation provides immediate feedback and prevents invalid transactions. However, we rely on smart contract validation as the source of truth.

### Transaction Safety

**Approval Flow:**
- Check allowance before redemption
- Request approval only when needed
- Display approval transaction separately from main transaction

**Amount Verification:**
- Display calculated amounts before submission
- Show breakdown of costs (collateral + fees)
- Require user confirmation for large transactions

**Design Rationale**: Explicit approval flow prevents unexpected token transfers. Amount verification ensures users understand transaction costs. Confirmation for large amounts prevents costly mistakes.

### Wallet Security

**Best Practices:**
- Never request private keys
- Use RainbowKit's secure wallet connection
- Display transaction details before signing
- Warn users about phishing risks

**Design Rationale**: Following Web3 security best practices protects users from common attacks. RainbowKit handles wallet connection securely. Clear transaction details help users verify they're signing the right transaction.

### Data Privacy

**No Personal Data Collection:**
- No email, name, or personal information required
- Wallet addresses are public blockchain data
- No tracking cookies (except analytics)

**Design Rationale**: Minimizing data collection reduces privacy risks and regulatory burden. Wallet addresses are already public on-chain, so displaying them doesn't create new privacy concerns.

## Future Enhancements

### Phase 2 Features

1. **Advanced Analytics Dashboard**
   - Historical aura charts
   - TVL trends over time
   - User portfolio tracking

2. **Social Features**
   - Creator profiles with bio and links
   - Fan leaderboards
   - Activity feed

3. **Mobile App**
   - React Native app for iOS/Android
   - Push notifications for aura updates
   - Biometric wallet unlock

4. **Advanced Trading**
   - Limit orders for minting/redemption
   - Token swaps between creator tokens
   - Liquidity pools

**Design Rationale**: Phase 2 features build on the core functionality once it's proven stable. Analytics provide deeper insights. Social features increase engagement. Mobile app improves accessibility. Advanced trading adds DeFi primitives.

### Technical Debt to Address

1. **Optimize RPC Calls**
   - Implement multicall for batch reads
   - Cache more aggressively
   - Use subgraph for historical data

2. **Improve Error Handling**
   - Add retry logic for failed transactions
   - Better error recovery flows
   - More granular error messages

3. **Enhance Testing**
   - Increase unit test coverage to 80%+
   - Add more E2E test scenarios
   - Implement visual regression testing

**Design Rationale**: Technical debt items are tracked for future sprints. Optimizing RPC calls reduces costs and improves performance. Better error handling improves UX. Enhanced testing prevents regressions.

## Conclusion

This design document provides a comprehensive blueprint for building the AuraFi frontend. The architecture prioritizes type safety, real-time updates, and user experience while maintaining flexibility for future enhancements. The component structure is modular and reusable, making it easy to add new features. The testing strategy ensures reliability, and the deployment process supports both local development and production deployment.

Key design decisions:
- **Next.js 15 App Router** for modern React features and performance
- **wagmi + viem** for type-safe Web3 interactions
- **TanStack Query** for efficient data fetching and caching
- **Environment-based configuration** for seamless network switching
- **Real-time updates** via polling + event listeners
- **Mobile-first responsive design** for accessibility
- **Comprehensive error handling** for better UX
- **Modular component architecture** for maintainability

The design addresses all 15 requirements from the requirements document and provides a solid foundation for building a production-ready DeFi application.
