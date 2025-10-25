# AuraFi Frontend Development Game Plan - Anvil Local Development

## Executive Summary

This document provides a comprehensive roadmap for building a Next.js frontend that interacts with AuraFi smart contracts. We'll start with **local Anvil development** for rapid iteration, then migrate to **Sepolia testnet** for production testing.

## Development Strategy

### Phase 1: Local Development (Anvil)
- Deploy contracts to local Anvil instance
- Use prefunded Anvil accounts in MetaMask
- RPC: `http://localhost:8545`
- Fast iteration, no gas costs, full control

### Phase 2: Production Migration (Sepolia)
- Deploy contracts to Sepolia testnet
- Update contract addresses in config
- Switch RPC to Sepolia
- Test with real testnet conditions

## 1. Local Anvil Setup

### 1.1 Start Anvil

```bash
# Terminal 1: Start Anvil with deterministic accounts
anvil --fork-url https://forno.celo-sepolia.celo-testnet.org --chain-id 11142220

# Anvil will output 10 prefunded accounts with private keys
# Example output:
# Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
# Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 1.2 Import Anvil Accounts to MetaMask

**Steps:**
1. Open MetaMask
2. Click account icon → Import Account
3. Paste private key from Anvil output
4. Repeat for 2-3 accounts (creator, fan1, fan2)

**Recommended accounts:**
- **Account #0** (Creator): `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Account #1** (Fan 1): `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Account #2** (Fan 2): `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

### 1.3 Add Anvil Network to MetaMask

**Network Details:**
- Network Name: `Anvil Local`
- RPC URL: `http://localhost:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`

### 1.4 Deploy Contracts to Anvil

```bash
# Terminal 2: Deploy contracts
export RPC_URL="http://localhost:8545"
export PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY -vv/

# Save the output addresses to lib/contracts/addresses.ts
```


## 2. Project Structure with Environment-Based Config

```
aurafi-frontend/
├── app/                          # Next.js 15 App Router
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
│   │   └── NetworkSwitch.tsx   # Network selector
│   └── ui/
│       ├── Button.tsx          # Reusable components
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Badge.tsx
│
├── lib/
│   ├── contracts/
│   │   ├── abis/               # ⭐ Contract ABIs (copied from out/)
│   │   │   ├── VaultFactory.json
│   │   │   ├── CreatorVault.json
│   │   │   ├── AuraOracle.json
│   │   │   └── CreatorToken.json
│   │   ├── addresses.ts        # ⭐ Environment-based addresses
│   │   └── config.ts           # Contract constants
│   ├── hooks/
│   │   ├── useVault.ts         # Vault data hook
│   │   ├── useVaultList.ts     # All vaults hook
│   │   ├── usePositions.ts     # User positions hook
│   │   └── useAura.ts          # Aura data hook
│   ├── utils/
│   │   ├── calculations.ts     # Peg, health, supply cap
│   │   ├── formatting.ts       # Number/address formatting
│   │   └── validation.ts       # Input validation
│   └── wagmi.ts                # ⭐ Environment-based wagmi config
│
├── .env.local                  # ⭐ Local Anvil config
├── .env.production             # ⭐ Sepolia config
├── next.config.js
├── package.json
└── tsconfig.json
```

## 3. Environment Configuration

### 3.1 Local Development (.env.local)

```bash
# .env.local - Anvil Local Development

# Network
NEXT_PUBLIC_NETWORK=anvil
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337

# WalletConnect (optional for local dev)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Contract Addresses (update after deploying to Anvil)
NEXT_PUBLIC_FACTORY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_ORACLE_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_TREASURY_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Optional: Enable debug logs
NEXT_PUBLIC_DEBUG=true
```

### 3.2 Production (.env.production)

```bash
# .env.production - Sepolia Testnet

# Network
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_CHAIN_ID=11155111

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Contract Addresses (update after deploying to Sepolia)
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_TREASURY_ADDRESS=0x...

# Disable debug logs
NEXT_PUBLIC_DEBUG=false
```

### 3.3 Contract Addresses Configuration

```typescript
// lib/contracts/addresses.ts

export type NetworkConfig = {
  factory: `0x${string}`
  oracle: `0x${string}`
  treasury: `0x${string}`
}

// Anvil local addresses (update after deployment)
const ANVIL_ADDRESSES: NetworkConfig = {
  factory: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  oracle: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  treasury: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
}

// Sepolia testnet addresses (update after deployment)
const SEPOLIA_ADDRESSES: NetworkConfig = {
  factory: '0x0000000000000000000000000000000000000000', // Update after deployment
  oracle: '0x0000000000000000000000000000000000000000', // Update after deployment
  treasury: '0x0000000000000000000000000000000000000000', // Update after deployment
}

// Get addresses based on environment
export function getContractAddresses(): NetworkConfig {
  const network = process.env.NEXT_PUBLIC_NETWORK || 'anvil'
  
  switch (network) {
    case 'anvil':
      return ANVIL_ADDRESSES
    case 'sepolia':
      return SEPOLIA_ADDRESSES
    default:
      throw new Error(`Unknown network: ${network}`)
  }
}

// Export for convenience
export const CONTRACTS = getContractAddresses()

// Validate addresses at build time
if (!CONTRACTS.factory || !CONTRACTS.oracle || !CONTRACTS.treasury) {
  throw new Error('Missing contract addresses for current network')
}

// Helper to check if address is placeholder
export function isPlaceholderAddress(address: string): boolean {
  return address === '0x0000000000000000000000000000000000000000'
}
```


### 3.4 Wagmi Configuration with Environment Support

```typescript
// lib/wagmi.ts
import { createConfig, http } from 'wagmi'
import { localhost, sepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// Define Anvil local chain
const anvilLocal = {
  id: 31337,
  name: 'Anvil Local',
  network: 'anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
    public: { http: ['http://localhost:8545'] },
  },
  blockExplorers: {
    default: { name: 'Local', url: 'http://localhost:8545' },
  },
  testnet: true,
} as const

// Get chain based on environment
function getChain() {
  const network = process.env.NEXT_PUBLIC_NETWORK || 'anvil'
  
  switch (network) {
    case 'anvil':
      return anvilLocal
    case 'sepolia':
      return sepolia
    default:
      return anvilLocal
  }
}

// Get RPC URL from environment
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'

export const config = getDefaultConfig({
  appName: 'AuraFi',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [getChain()],
  transports: {
    [getChain().id]: http(rpcUrl),
  },
})

// Export current chain for convenience
export const currentChain = getChain()
```

### 3.5 ABI Management

```typescript
// lib/contracts/abis/index.ts

// Import ABIs from Foundry build output
import VaultFactoryArtifact from '../../../../out/VaultFactory.sol/VaultFactory.json'
import CreatorVaultArtifact from '../../../../out/CreatorVault.sol/CreatorVault.json'
import AuraOracleArtifact from '../../../../out/AuraOracle.sol/AuraOracle.json'
import CreatorTokenArtifact from '../../../../out/CreatorToken.sol/CreatorToken.json'

// Export ABIs
export const VAULT_FACTORY_ABI = VaultFactoryArtifact.abi
export const CREATOR_VAULT_ABI = CreatorVaultArtifact.abi
export const AURA_ORACLE_ABI = AuraOracleArtifact.abi
export const CREATOR_TOKEN_ABI = CreatorTokenArtifact.abi

// Type-safe ABI exports
export type VaultFactoryABI = typeof VAULT_FACTORY_ABI
export type CreatorVaultABI = typeof CREATOR_VAULT_ABI
export type AuraOracleABI = typeof AURA_ORACLE_ABI
export type CreatorTokenABI = typeof CREATOR_TOKEN_ABI
```

**Alternative: Copy ABIs manually**

If you prefer to copy ABIs instead of importing from `out/`:

```bash
# Create script to copy ABIs
# scripts/copy-abis.sh

#!/bin/bash

# Copy ABIs from Foundry output to frontend
cp ../out/VaultFactory.sol/VaultFactory.json ./lib/contracts/abis/
cp ../out/CreatorVault.sol/CreatorVault.json ./lib/contracts/abis/
cp ../out/AuraOracle.sol/AuraOracle.json ./lib/contracts/abis/
cp ../out/CreatorToken.sol/CreatorToken.json ./lib/contracts/abis/

echo "✅ ABIs copied successfully"
```

Then import normally:

```typescript
// lib/contracts/abis/index.ts
import VaultFactoryArtifact from './VaultFactory.json'
import CreatorVaultArtifact from './CreatorVault.json'
import AuraOracleArtifact from './AuraOracle.json'
import CreatorTokenArtifact from './CreatorToken.json'

export const VAULT_FACTORY_ABI = VaultFactoryArtifact.abi
export const CREATOR_VAULT_ABI = CreatorVaultArtifact.abi
export const AURA_ORACLE_ABI = AuraOracleArtifact.abi
export const CREATOR_TOKEN_ABI = CreatorTokenArtifact.abi
```

## 4. Local Development Workflow

### 4.1 Complete Setup Steps

```bash
# Step 1: Start Anvil (Terminal 1)
anvil --chain-id 31337

# Step 2: Deploy contracts (Terminal 2)
cd /path/to/smart-contracts
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Note the deployed addresses from output:
# Factory: 0x5FbDB2315678afecb367f032d93F642f64180aa3
# Oracle: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
# Treasury: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Step 3: Create Next.js frontend (Terminal 3)
npx create-next-app@latest aurafi-frontend --typescript --tailwind --app
cd aurafi-frontend

# Step 4: Install dependencies
npm install wagmi@^2.18.2 viem@^2.38.4 @tanstack/react-query@^5.90.5 @rainbow-me/rainbowkit@^2.2.9
npm install sonner@^2.0.7 date-fns@^4.1.0 clsx@^2.1.1 tailwind-merge@^3.3.1
npm install lucide-react@^0.548.0 react-hook-form@^7.65.0 @hookform/resolvers@^5.2.2 zod@^4.1.12

# Step 5: Create lib structure
mkdir -p lib/contracts/abis
mkdir -p lib/hooks
mkdir -p lib/utils

# Step 6: Copy ABIs
cp ../out/VaultFactory.sol/VaultFactory.json ./lib/contracts/abis/
cp ../out/CreatorVault.sol/CreatorVault.json ./lib/contracts/abis/
cp ../out/AuraOracle.sol/AuraOracle.json ./lib/contracts/abis/
cp ../out/CreatorToken.sol/CreatorToken.json ./lib/contracts/abis/

# Step 7: Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_NETWORK=anvil
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_FACTORY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_ORACLE_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_TREASURY_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
EOF

# Step 8: Start frontend dev server
npm run dev
```

### 4.2 Testing with Anvil Accounts

**Scenario 1: Creator creates vault and bootstraps**
1. Switch MetaMask to Account #0 (Creator)
2. Connect wallet to dApp
3. **Create new vault** via VaultFactory.createVault()
   - Input: Token name ("Alice Token"), symbol ("ALICE"), base capacity (1000 tokens)
   - Result: New CreatorVault + CreatorToken deployed
4. **Bootstrap vault** with 100 ETH to unlock Stage 1
   - Enables fans to mint up to 500 tokens
5. Wait for oracle to set initial aura (or manually trigger if testing)

**Scenario 2: Fan mints tokens**
1. Switch MetaMask to Account #1 (Fan)
2. Connect wallet to dApp
3. Browse vault list (shows all creator vaults)
4. Navigate to creator's vault (created in Scenario 1)
5. Check current peg (e.g., 1.18 CELO per token)
6. Mint 10 tokens
   - Calculates required collateral: 10 × 1.18 × 1.5 × 1.005 ≈ 17.8 CELO
   - Creates Position tracking this mint
7. Verify token balance increased

**Scenario 3: Fan redeems tokens**
1. Stay on Account #1 (Fan)
2. View your positions (FIFO list)
3. Redeem 5 tokens
   - Burns tokens from oldest position first
   - Returns proportional CELO from that position
4. Verify CELO returned and position updated

**Scenario 4: Creator unlocks next stage**
1. Switch MetaMask to Account #0 (Creator)
2. View vault management page
3. See current stage (1) and next stage requirements (300 CELO total)
4. Deposit 200 more CELO to unlock Stage 2
5. Verify capacity increased to 2,500 tokens

**Scenario 5: Liquidator earns bounty**
1. Switch MetaMask to Account #2 (Liquidator)
2. Browse vaults with health < 120%
3. Select unhealthy vault
4. Inject CELO to restore health
5. Receive 1% bounty + creator penalty immediately

### 4.3 Resetting Anvil State

```bash
# If you need to reset and start fresh:
# 1. Stop Anvil (Ctrl+C)
# 2. Restart Anvil
anvil --chain-id 31337

# 3. Redeploy contracts
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# 4. Update addresses in .env.local if they changed
# 5. Restart frontend dev server
```


## 5. Migration to Sepolia Testnet

### 5.1 Prerequisites

**Get Sepolia ETH:**
- [Sepolia Faucet 1](https://sepoliafaucet.com/)
- [Sepolia Faucet 2](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Sepolia Faucet 3](https://faucet.quicknode.com/ethereum/sepolia)

**Get Infura/Alchemy API Key:**
- [Infura](https://infura.io/) - Free tier sufficient
- [Alchemy](https://www.alchemy.com/) - Alternative

### 5.2 Deploy to Sepolia

```bash
# Step 1: Set up environment for deployment
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
export PRIVATE_KEY=your_deployer_private_key

# Step 2: Deploy contracts to Sepolia
forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key YOUR_ETHERSCAN_KEY

# Step 3: Note the deployed addresses
# Factory: 0x...
# Oracle: 0x...
# Treasury: 0x...
```

### 5.3 Update Frontend Configuration

```typescript
// lib/contracts/addresses.ts

// Update Sepolia addresses
const SEPOLIA_ADDRESSES: NetworkConfig = {
  factory: '0xYourSepoliaFactoryAddress',
  oracle: '0xYourSepoliaOracleAddress',
  treasury: '0xYourSepoliaTreasuryAddress',
}
```

```bash
# Update .env.production
cat > .env.production << EOF
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_FACTORY_ADDRESS=0xYourSepoliaFactoryAddress
NEXT_PUBLIC_ORACLE_ADDRESS=0xYourSepoliaOracleAddress
NEXT_PUBLIC_TREASURY_ADDRESS=0xYourSepoliaTreasuryAddress
EOF
```

### 5.4 Test on Sepolia

```bash
# Build with production config
npm run build

# Start production server locally
npm start

# Or deploy to Vercel
vercel --prod
```

**Testing checklist:**
- [ ] Wallet connects to Sepolia
- [ ] Can view deployed vaults
- [ ] Can create new vault
- [ ] Creator can bootstrap and unlock stages
- [ ] Fan can mint tokens
- [ ] Fan can redeem tokens
- [ ] Transactions appear on Sepolia Etherscan
- [ ] Events are emitted correctly

### 5.5 Network Switching in UI

```typescript
// components/wallet/NetworkSwitch.tsx
'use client'

import { useAccount, useSwitchChain } from 'wagmi'
import { currentChain } from '@/lib/wagmi'

export function NetworkSwitch() {
  const { chain } = useAccount()
  const { switchChain } = useSwitchChain()

  const isWrongNetwork = chain && chain.id !== currentChain.id

  if (!isWrongNetwork) return null

  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
      <p className="font-bold">Wrong Network</p>
      <p>Please switch to {currentChain.name}</p>
      <button
        onClick={() => switchChain({ chainId: currentChain.id })}
        className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded"
      >
        Switch to {currentChain.name}
      </button>
    </div>
  )
}
```

## 6. Development Phases

### Phase 1: Foundation (Week 1) - Anvil
**Goal:** Basic Next.js app with wallet connection on Anvil

**Tasks:**
1. ✅ Initialize Next.js project
2. ✅ Install dependencies (wagmi, viem, RainbowKit)
3. ✅ Configure wagmi for Anvil local
4. ✅ Set up RainbowKit wallet connection
5. ✅ Create basic layout with header + wallet button
6. ✅ Copy contract ABIs to lib/contracts/abis/
7. ✅ Create addresses.ts with Anvil addresses
8. ✅ Test wallet connection with Anvil accounts

**Deliverables:**
- Working Next.js app on localhost:3000
- Wallet connection functional with Anvil
- Can read user's ETH balance from Anvil

### Phase 2: Vault Discovery (Week 1-2) - Anvil
**Goal:** Display list of vaults with basic info

**Tasks:**
1. Create `useVaultList` hook to fetch vaults from factory events
   - Listen for VaultCreated events from VaultFactory
   - Parse vault address, token address, creator address
2. Implement VaultCard component
   - Show creator address, token name/symbol
   - Display aura, peg, health, TVL
3. Build vault list page with grid layout
4. Add vault detail page route
5. Create VaultStats component to display vault state
6. Add AuraDisplay component showing aura score and derived peg
7. Test with vaults created by Anvil Account #0 (Creator)

**Deliverables:**
- Vault discovery page showing all creator-created vaults
- Vault detail page with live data from Anvil
- Can see aura, peg, health for any vault
- Clear indication of which creator owns which vault

### Phase 3: Fan Minting (Week 2) - Anvil
**Goal:** Fans can mint tokens on Anvil

**Tasks:**
1. Create MintForm component
2. Implement mint cost calculation
3. Add input validation
4. Build transaction flow
5. Add transaction status UI
6. Implement event listening
7. Test minting with Anvil Account #1

**Deliverables:**
- Working mint interface
- Real-time cost calculation
- Transaction feedback
- Position tracking

### Phase 4: Fan Redemption (Week 2-3) - Anvil
**Goal:** Fans can redeem tokens for ETH

**Tasks:**
1. Create `usePositions` hook
2. Build PositionList component
3. Implement RedeemForm component
4. Calculate estimated ETH return
5. Add health check validation
6. Build transaction flow
7. Test redemption with Anvil accounts

**Deliverables:**
- Position list display
- Working redemption interface
- FIFO calculation preview
- Transaction feedback

### Phase 5: Creator Management (Week 3) - Anvil
**Goal:** Creators can manage their vaults

**Tasks:**
1. Create vault creation flow
2. Build StakeForm for bootstrap
3. Add stage progression UI
4. Show creator-specific metrics
5. Add creator dashboard page
6. Test with Anvil Account #0

**Deliverables:**
- Vault creation interface
- Creator staking interface
- Stage progression tracking
- Creator dashboard

### Phase 6: Sepolia Migration (Week 3-4)
**Goal:** Deploy to Sepolia and test in production-like environment

**Tasks:**
1. Deploy contracts to Sepolia
2. Update addresses.ts with Sepolia addresses
3. Create .env.production
4. Test all flows on Sepolia
5. Fix any network-specific issues
6. Verify transactions on Etherscan

**Deliverables:**
- Contracts deployed to Sepolia
- Frontend working on Sepolia
- All features tested on testnet

### Phase 7: Advanced Features (Week 4) - Sepolia
**Goal:** Forced burns, liquidations, monitoring

**Tasks:**
1. Add forced burn detection
2. Create forced burn alert UI
3. Implement liquidator dashboard
4. Create LiquidateForm component
5. Add health monitoring
6. Test edge cases on Sepolia

**Deliverables:**
- Forced burn detection and alerts
- Liquidation interface
- Health monitoring dashboard

### Phase 8: Polish & Production (Week 4-5)
**Goal:** Production-ready UI

**Tasks:**
1. Add loading states and skeletons
2. Implement error boundaries
3. Add toast notifications
4. Improve responsive design
5. Add dark mode support
6. Deploy to Vercel
7. Set up monitoring

**Deliverables:**
- Polished UI/UX
- Error handling
- Responsive design
- Production deployment


## 7. Quick Reference Commands

### 7.1 Anvil Development

```bash
# Terminal 1: Start Anvil
anvil --chain-id 31337

# Terminal 2: Deploy contracts
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Terminal 3: Start frontend
cd aurafi-frontend
npm run dev

# Copy ABIs after contract changes
npm run copy-abis  # Add this script to package.json
```

### 7.2 Sepolia Deployment

```bash
# Deploy to Sepolia
forge script script/Deploy.s.sol \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify

# Update frontend addresses
# Edit lib/contracts/addresses.ts

# Build and deploy frontend
npm run build
vercel --prod
```

### 7.3 Useful Scripts (package.json)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "copy-abis": "node scripts/copy-abis.js",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

### 7.4 ABI Copy Script

```javascript
// scripts/copy-abis.js
const fs = require('fs')
const path = require('path')

const contracts = [
  'VaultFactory',
  'CreatorVault',
  'AuraOracle',
  'CreatorToken'
]

const sourceDir = path.join(__dirname, '../../out')
const targetDir = path.join(__dirname, '../lib/contracts/abis')

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

contracts.forEach(contract => {
  const sourcePath = path.join(sourceDir, `${contract}.sol/${contract}.json`)
  const targetPath = path.join(targetDir, `${contract}.json`)
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath)
    console.log(`✅ Copied ${contract}.json`)
  } else {
    console.warn(`⚠️  ${contract}.json not found at ${sourcePath}`)
  }
})

console.log('\n✨ ABIs copied successfully!')
```

## 8. Troubleshooting

### 8.1 Common Anvil Issues

**Issue:** MetaMask shows "Nonce too high"
**Solution:**
```
1. Go to MetaMask Settings → Advanced
2. Click "Clear activity tab data"
3. Refresh the page
```

**Issue:** Transactions fail with "insufficient funds"
**Solution:**
```
1. Verify you're using an Anvil prefunded account
2. Check account balance in MetaMask
3. Restart Anvil if balance is 0
```

**Issue:** Contract not found at address
**Solution:**
```
1. Verify Anvil is running
2. Redeploy contracts
3. Update addresses in .env.local
4. Restart Next.js dev server
```

### 8.2 Common Frontend Issues

**Issue:** "Cannot read properties of undefined (reading 'abi')"
**Solution:**
```
1. Verify ABIs are copied to lib/contracts/abis/
2. Check import paths in code
3. Run npm run copy-abis
```

**Issue:** Wallet won't connect
**Solution:**
```
1. Check MetaMask is on correct network (Anvil or Sepolia)
2. Verify RPC URL in .env.local
3. Check wagmi configuration
4. Clear browser cache
```

**Issue:** Data not updating after transaction
**Solution:**
```
1. Check event listeners are set up
2. Verify query invalidation on success
3. Check refetch interval settings
4. Look for errors in console
```

### 8.3 Network Switching Issues

**Issue:** Can't switch to Anvil network in MetaMask
**Solution:**
```
1. Manually add Anvil network to MetaMask
2. Network Name: Anvil Local
3. RPC URL: http://localhost:8545
4. Chain ID: 31337
5. Currency: ETH
```

**Issue:** Wrong network detected
**Solution:**
```
1. Check NEXT_PUBLIC_NETWORK in .env
2. Verify currentChain in wagmi.ts
3. Clear browser cache
4. Restart dev server
```

## 9. Example Code Snippets

### 9.1 Environment-Aware Hook

```typescript
// lib/hooks/useVault.ts
import { useReadContract } from 'wagmi'
import { CONTRACTS } from '../contracts/addresses'
import { CREATOR_VAULT_ABI } from '../contracts/abis'

export function useVault(vaultAddress: `0x${string}`) {
  const { data: vaultState, isLoading, error } = useReadContract({
    address: vaultAddress,
    abi: CREATOR_VAULT_ABI,
    functionName: 'getVaultState',
    query: {
      refetchInterval: 10_000, // Refetch every 10s
    }
  })

  const { data: aura } = useReadContract({
    address: vaultAddress,
    abi: CREATOR_VAULT_ABI,
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
    isLoading,
    error,
  }
}
```

### 9.2 Network Indicator Component

```typescript
// components/NetworkIndicator.tsx
'use client'

import { useAccount } from 'wagmi'
import { currentChain } from '@/lib/wagmi'

export function NetworkIndicator() {
  const { chain } = useAccount()

  if (!chain) return null

  const isCorrectNetwork = chain.id === currentChain.id

  return (
    <div className={`px-3 py-1 rounded-full text-sm ${
      isCorrectNetwork 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {chain.name}
    </div>
  )
}
```

### 9.3 Debug Panel (Development Only)

```typescript
// components/DebugPanel.tsx
'use client'

import { useAccount } from 'wagmi'
import { CONTRACTS } from '@/lib/contracts/addresses'
import { currentChain } from '@/lib/wagmi'

export function DebugPanel() {
  const { address, chain } = useAccount()

  // Only show in development
  if (process.env.NEXT_PUBLIC_DEBUG !== 'true') return null

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-md">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <p>Network: {currentChain.name} ({currentChain.id})</p>
        <p>Connected: {chain?.name || 'Not connected'}</p>
        <p>Address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'None'}</p>
        <p>Factory: {CONTRACTS.factory}</p>
        <p>Oracle: {CONTRACTS.oracle}</p>
        <p>Treasury: {CONTRACTS.treasury}</p>
      </div>
    </div>
  )
}
```

## 10. Summary & Next Steps

### 10.1 What You Have

✅ **Complete development strategy:**
- Start with Anvil for fast iteration
- Migrate to Sepolia for production testing
- Environment-based configuration

✅ **Flexible architecture:**
- Single codebase for both environments
- Easy address and network switching
- Reusable components and hooks

✅ **Clear migration path:**
- Test everything locally first
- Deploy to Sepolia when ready
- Simple configuration changes

### 10.2 Immediate Next Steps

**1. Set up Anvil environment (30 minutes)**
```bash
# Start Anvil
anvil --chain-id 31337

# Import accounts to MetaMask
# Add Anvil network to MetaMask
```

**2. Deploy contracts to Anvil (15 minutes)**
```bash
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
# Note the addresses
```

**3. Initialize frontend (1 hour)**
```bash
npx create-next-app@15.2.4 aurafi-frontend --typescript --tailwind --app
cd aurafi-frontend
npm install wagmi@^2.18.2 viem@^2.38.4 @tanstack/react-query@^5.90.5 @rainbow-me/rainbowkit@^2.2.9
npm install sonner@^2.0.7 date-fns@^4.1.0 clsx@^2.1.1 tailwind-merge@^3.3.1
npm install lucide-react@^0.548.0 react-hook-form@^7.65.0 @hookform/resolvers@^5.2.2 zod@^4.1.12
```

**4. Set up configuration (30 minutes)**
```bash
# Create lib structure
mkdir -p lib/contracts/abis lib/hooks lib/utils

# Copy ABIs
# Create addresses.ts
# Create wagmi.ts
# Create .env.local
```

**5. Build first feature (2-3 hours)**
```bash
# Create wallet connection
# Build vault list page
# Test with Anvil
```

### 10.3 When to Migrate to Sepolia

Migrate when you have:
- ✅ All core features working on Anvil
- ✅ Wallet connection stable
- ✅ Mint/redeem flows tested
- ✅ Creator management working
- ✅ No major bugs

Then:
1. Deploy contracts to Sepolia
2. Update addresses.ts
3. Create .env.production
4. Test thoroughly
5. Deploy frontend to Vercel

---

**You're ready to start building! Begin with Phase 1 (Foundation) on Anvil.**
