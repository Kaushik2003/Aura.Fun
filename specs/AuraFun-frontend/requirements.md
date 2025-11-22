# AuraFi Frontend Requirements Document

## Introduction

This document defines the requirements for building a Next.js frontend application that enables users to interact with the AuraFi protocol smart contracts. The AuraFi protocol is a creator-fan token system where creators deploy vaults, stake collateral to unlock stages, and fans mint/redeem creator tokens backed by CELO collateral. The token peg and supply cap are dynamically determined by an "aura" score (0-200) that reflects creator engagement metrics.

The frontend will support three primary user roles: **Creators** (who deploy and manage vaults), **Fans** (who mint and redeem tokens), and **Liquidators** (who restore vault health). The application will start with local Anvil development for rapid iteration, then migrate to Sepolia testnet for production testing.

## Glossary

- **AuraFi Protocol**: A DeFi protocol enabling creators to launch tokenized vaults backed by dual collateral (creator + fan CELO deposits)
- **Creator**: A user who deploys a CreatorVault and stakes CELO to unlock stages
- **Fan**: A user who mints creator tokens by depositing CELO collateral at 150% collateralization
- **Liquidator**: A user who injects CELO to restore vault health when collateralization drops below 120%
- **Vault**: A CreatorVault smart contract instance managing collateral, token supply, and lifecycle
- **Token**: An ERC20 CreatorToken representing fan ownership in a creator's vault
- **Aura**: A score (0-200) reflecting creator engagement, used to calculate peg and supply cap
- **Peg**: The current price of one creator token in CELO, calculated from aura (range: 0.3 to 3.0 CELO)
- **Stage**: A progression level (0-4) unlocked by creator collateral deposits, determining mint capacity
- **Position**: A record of a fan's mint transaction, tracking tokens and collateral for FIFO redemption
- **Health**: The collateralization ratio (totalCollateral / (totalSupply × peg)), expressed as a percentage
- **Supply Cap**: Maximum allowed token supply based on aura, calculated as BaseCap × (1 + 0.75 × (aura - 100) / 100)
- **Forced Burn**: A mechanism triggered when supply exceeds cap after aura drops, with 24-hour grace period
- **VaultFactory**: Smart contract that deploys new CreatorVault and CreatorToken pairs
- **AuraOracle**: Smart contract storing aura scores with IPFS evidence, updated by oracle service
- **Treasury**: Smart contract collecting protocol fees (0.5% of mint collateral)
- **Anvil**: Local Ethereum development network for testing (Chain ID: 31337)
- **Sepolia**: Ethereum testnet for production-like testing (Chain ID: 11155111)
- **wagmi**: React hooks library for Ethereum interactions
- **viem**: TypeScript Ethereum library for contract interactions
- **RainbowKit**: Wallet connection UI library

## Requirements

### Requirement 1: Wallet Connection and Network Management

**User Story:** As a user, I want to connect my Web3 wallet and ensure I'm on the correct network, so that I can interact with the AuraFi protocol contracts.

#### Acceptance Criteria

1. WHEN a user visits the application, THE Frontend_Application SHALL display a "Connect Wallet" button in the header
2. WHEN a user clicks "Connect Wallet", THE Frontend_Application SHALL present wallet options via RainbowKit (MetaMask, WalletConnect, etc.)
3. WHEN a user successfully connects their wallet, THE Frontend_Application SHALL display the user's truncated address (first 6 and last 4 characters) and CELO balance
4. WHEN a user is connected to the wrong network, THE Frontend_Application SHALL display a prominent warning banner with network name mismatch
5. WHEN a user clicks "Switch Network" in the warning banner, THE Frontend_Application SHALL trigger a network switch request to the correct network (Anvil local or Sepolia testnet based on environment configuration)
6. WHEN the application loads, THE Frontend_Application SHALL read the NEXT_PUBLIC_NETWORK environment variable to determine the target network (anvil or sepolia)
7. WHEN a user disconnects their wallet, THE Frontend_Application SHALL clear all user-specific data and return to the initial state

### Requirement 2: Vault Discovery and Browsing

**User Story:** As a fan, I want to browse all available creator vaults and view their key metrics, so that I can discover creators to support and evaluate vault health.

#### Acceptance Criteria

1. WHEN a user navigates to the vaults page, THE Frontend_Application SHALL fetch all VaultCreated events from the VaultFactory contract
2. WHEN vault data is loading, THE Frontend_Application SHALL display skeleton loading states for vault cards
3. WHEN vaults are loaded, THE Frontend_Application SHALL display a grid of vault cards showing creator address, token name, token symbol, current aura, current peg, health ratio, and TVL (total collateral)
4. WHEN a user views a vault card, THE Frontend_Application SHALL color-code the health indicator (green for ≥150%, yellow for 120-150%, red for <120%)
5. WHEN a user clicks on a vault card, THE Frontend_Application SHALL navigate to the vault detail page at /vaults/[address]
6. WHEN a user applies filters, THE Frontend_Application SHALL filter vaults by creator address, health range, or stage
7. WHEN a user applies sorting, THE Frontend_Application SHALL sort vaults by TVL, aura, or health in ascending or descending order

### Requirement 3: Vault Detail View

**User Story:** As a user, I want to view comprehensive information about a specific vault, so that I can understand its current state and make informed decisions.

#### Acceptance Criteria

1. WHEN a user navigates to a vault detail page, THE Frontend_Application SHALL call the vault's getVaultState() function to fetch all metrics in one call
2. WHEN vault state is loading, THE Frontend_Application SHALL display skeleton loading states for all metrics
3. WHEN vault state is loaded, THE Frontend_Application SHALL display creator collateral, fan collateral, total collateral, total supply, current peg, current stage, health ratio, and current aura
4. WHEN displaying the aura score, THE Frontend_Application SHALL show a visual gauge or chart representing the 0-200 range
5. WHEN displaying the peg, THE Frontend_Application SHALL show the CELO per token price with 4 decimal places
6. WHEN displaying the health ratio, THE Frontend_Application SHALL show the percentage with color coding (green/yellow/red)
7. WHEN displaying stage information, THE Frontend_Application SHALL show current stage number, progress bar to next stage, and requirements for next stage unlock
8. WHEN vault data changes (via events or polling), THE Frontend_Application SHALL automatically refetch and update displayed metrics every 10 seconds

### Requirement 4: Fan Token Minting

**User Story:** As a fan, I want to mint creator tokens by depositing CELO collateral, so that I can support a creator and hold their tokens.

#### Acceptance Criteria

1. WHEN a fan views a vault detail page, THE Frontend_Application SHALL display a "Mint Tokens" form with quantity input field
2. WHEN a fan enters a token quantity, THE Frontend_Application SHALL calculate and display required collateral as (quantity × peg × 1.5), mint fee as (required collateral × 0.005), and total cost as (required collateral + fee)
3. WHEN a fan submits the mint form, THE Frontend_Application SHALL validate that stage > 0, totalSupply + quantity ≤ stage mint cap, and totalSupply + quantity ≤ supply cap
4. IF validation fails, THEN THE Frontend_Application SHALL display a user-friendly error message explaining the constraint (e.g., "Stage not unlocked", "Exceeds stage capacity", "Exceeds supply cap")
5. WHEN validation passes, THE Frontend_Application SHALL call the vault's mintTokens(quantity) function with msg.value = total cost
6. WHEN the transaction is pending, THE Frontend_Application SHALL display a loading spinner and "Transaction pending" message
7. WHEN the transaction succeeds, THE Frontend_Application SHALL display a success toast notification, refetch vault data, and update the user's token balance
8. WHEN the transaction fails, THE Frontend_Application SHALL parse the revert reason and display a user-friendly error message

### Requirement 5: Fan Token Redemption

**User Story:** As a fan, I want to redeem my creator tokens for CELO collateral, so that I can exit my position and recover my funds.

#### Acceptance Criteria

1. WHEN a fan views a vault detail page with token balance > 0, THE Frontend_Application SHALL display a "Redeem Tokens" form with quantity input field
2. WHEN a fan enters a redemption quantity, THE Frontend_Application SHALL fetch the user's positions via getPosition() calls and calculate estimated CELO return using FIFO logic
3. WHEN displaying estimated return, THE Frontend_Application SHALL show the CELO amount with 4 decimal places and a note that positions are processed in FIFO order
4. WHEN a fan submits the redeem form, THE Frontend_Application SHALL validate that quantity ≤ user's token balance and health after redemption ≥ 150%
5. IF validation fails, THEN THE Frontend_Application SHALL display an error message (e.g., "Insufficient balance", "Would drop health below 150%")
6. WHEN validation passes, THE Frontend_Application SHALL first call token.approve(vault, quantity) if allowance is insufficient
7. WHEN approval succeeds, THE Frontend_Application SHALL call vault.redeemTokens(quantity)
8. WHEN the redemption transaction succeeds, THE Frontend_Application SHALL display a success toast, refetch vault data, and update the user's CELO and token balances

### Requirement 6: User Position Tracking

**User Story:** As a fan, I want to view all my minting positions for a vault, so that I can track my investments and understand FIFO redemption order.

#### Acceptance Criteria

1. WHEN a fan views a vault detail page, THE Frontend_Application SHALL call getPositionCount(userAddress) to determine the number of positions
2. WHEN position count > 0, THE Frontend_Application SHALL call getPosition(userAddress, index) for each index to fetch position details
3. WHEN positions are loaded, THE Frontend_Application SHALL display a table with columns: position index, token quantity, collateral amount, stage at mint, and creation timestamp
4. WHEN displaying positions, THE Frontend_Application SHALL sort them in FIFO order (oldest first) with visual indication that redemptions process from top to bottom
5. WHEN a position has qty = 0 (fully redeemed), THE Frontend_Application SHALL display it as "Redeemed" or hide it from the list
6. WHEN displaying position values, THE Frontend_Application SHALL show token quantities and CELO amounts with appropriate decimal precision
7. WHEN positions change (after mint or redeem), THE Frontend_Application SHALL automatically refetch and update the position list

### Requirement 7: Creator Vault Creation with Aura Integration

**User Story:** As a creator, I want to deploy a new vault with my custom token name, symbol, and Farcaster username, so that I can launch my creator token with automatic aura score calculation.

#### Acceptance Criteria

1. WHEN a creator navigates to the /create page, THE Frontend_Application SHALL display a vault creation form with fields for token name, token symbol, base capacity, and Farcaster username
2. WHEN a creator enters form values, THE Frontend_Application SHALL validate that name, symbol, and Farcaster username are non-empty and base capacity > 0
3. WHEN a creator submits the form, THE Frontend_Application SHALL call factory.createVault(name, symbol, creatorAddress, baseCap)
4. WHEN the transaction is pending, THE Frontend_Application SHALL display a loading state with "Deploying vault..." message
5. WHEN the transaction succeeds, THE Frontend_Application SHALL listen for the VaultCreated event to extract the new vault address and token address
6. WHEN vault addresses are extracted, THE Frontend_Application SHALL automatically initiate aura calculation by calling the oracle API with the vault address and Farcaster username
7. WHEN aura calculation is in progress, THE Frontend_Application SHALL display "Calculating aura score..." message with loading indicator
8. WHEN aura calculation succeeds, THE Frontend_Application SHALL display a success message with vault address, token address, initial aura score, and a "Go to Vault" button
9. IF aura calculation fails, THEN THE Frontend_Application SHALL display a warning message that the vault was created but aura needs to be set manually later
10. WHEN the creator clicks "Go to Vault", THE Frontend_Application SHALL navigate to the vault detail page at /vaults/[vaultAddress]

### Requirement 8: Creator Vault Bootstrapping

**User Story:** As a creator, I want to deposit initial CELO collateral to unlock Stage 1, so that fans can start minting my tokens.

#### Acceptance Criteria

1. WHEN a creator views their vault detail page with stage = 0, THE Frontend_Application SHALL display a "Bootstrap Vault" form with CELO amount input
2. WHEN the form is displayed, THE Frontend_Application SHALL show the Stage 1 requirement (0.001 CELO) and explain that bootstrapping unlocks fan minting
3. WHEN a creator enters a CELO amount, THE Frontend_Application SHALL validate that amount ≥ 0.001 CELO (Stage 1 requirement)
4. IF amount < 0.001 CELO, THEN THE Frontend_Application SHALL display an error message "Minimum 0.001 CELO required to unlock Stage 1"
5. WHEN validation passes, THE Frontend_Application SHALL call vault.bootstrapCreatorStake() with msg.value = entered amount
6. WHEN the transaction succeeds, THE Frontend_Application SHALL display a success toast "Stage 1 unlocked!", refetch vault data, and update the stage indicator
7. WHEN stage updates to 1, THE Frontend_Application SHALL hide the bootstrap form and show the stage progression UI

### Requirement 9: Creator Stage Unlocking

**User Story:** As a creator, I want to deposit additional CELO to unlock higher stages, so that I can increase my vault's mint capacity.

#### Acceptance Criteria

1. WHEN a creator views their vault detail page with stage > 0, THE Frontend_Application SHALL display a stage progression UI showing current stage, next stage requirements, and progress bar
2. WHEN displaying stage progression, THE Frontend_Application SHALL show cumulative stake required for next stage, current creator collateral, and remaining amount needed
3. WHEN a creator clicks "Unlock Next Stage", THE Frontend_Application SHALL display a form with CELO amount input pre-filled with the remaining amount needed
4. WHEN a creator submits the unlock form, THE Frontend_Application SHALL validate that current collateral + entered amount ≥ next stage requirement
5. IF validation fails, THEN THE Frontend_Application SHALL display an error message "Insufficient amount to unlock Stage X"
6. WHEN validation passes, THE Frontend_Application SHALL call vault.unlockStage() with msg.value = entered amount
7. WHEN the transaction succeeds, THE Frontend_Application SHALL display a success toast "Stage X unlocked!", refetch vault data, and update the stage progression UI

### Requirement 10: Forced Burn Detection and Alerts

**User Story:** As a user, I want to be notified when a vault's supply exceeds its cap and a forced burn is triggered, so that I can take action during the grace period.

#### Acceptance Criteria

1. WHEN the Frontend_Application loads a vault detail page, THE Frontend_Application SHALL listen for SupplyCapShrink events from the vault contract
2. WHEN a SupplyCapShrink event is detected, THE Frontend_Application SHALL display a prominent alert banner with message "Forced burn triggered! Grace period ends at [timestamp]"
3. WHEN displaying the forced burn alert, THE Frontend_Application SHALL show pending burn amount, new supply cap, and countdown timer to grace period end
4. WHEN the grace period is active (current time < forcedBurnDeadline), THE Frontend_Application SHALL display the countdown in hours and minutes
5. WHEN the grace period expires (current time ≥ forcedBurnDeadline), THE Frontend_Application SHALL display "Grace period expired - forced burn can be executed"
6. WHEN a user views a vault with pendingForcedBurn > 0, THE Frontend_Application SHALL display a "Check Forced Burn" button that calls vault.checkAndTriggerForcedBurn()
7. WHEN forced burn is executed (via executeForcedBurn), THE Frontend_Application SHALL refetch vault data and hide the alert banner

### Requirement 11: Liquidation Interface

**User Story:** As a liquidator, I want to inject CELO into undercollateralized vaults to restore health and earn bounties, so that I can profit from liquidation opportunities.

#### Acceptance Criteria

1. WHEN a liquidator navigates to the /liquidate page, THE Frontend_Application SHALL fetch all vaults and filter those with health < 120%
2. WHEN displaying liquidatable vaults, THE Frontend_Application SHALL show vault address, creator, current health, tokens to remove, and estimated bounty
3. WHEN a liquidator clicks on a liquidatable vault, THE Frontend_Application SHALL display a liquidation form with CELO amount input
4. WHEN a liquidator enters a CELO amount, THE Frontend_Application SHALL calculate tokens to remove as totalSupply - ((totalCollateral + amount) / (peg × 1.5))
5. WHEN displaying liquidation preview, THE Frontend_Application SHALL show tokens to remove, bounty (1% of payment), creator penalty (10% of creator collateral, capped at 20% of payment), and health after liquidation
6. WHEN a liquidator submits the form, THE Frontend_Application SHALL validate that amount ≥ 0.01 CELO and health after liquidation ≥ 150%
7. WHEN validation passes, THE Frontend_Application SHALL call vault.liquidate() with msg.value = entered amount
8. WHEN the liquidation transaction succeeds, THE Frontend_Application SHALL display a success toast with bounty amount earned and refetch vault data

### Requirement 12: Real-Time Data Updates

**User Story:** As a user, I want to see real-time updates to vault data when events occur, so that I always have current information.

#### Acceptance Criteria

1. WHEN the Frontend_Application displays vault data, THE Frontend_Application SHALL poll the vault's getVaultState() function every 10 seconds
2. WHEN a Minted event is emitted for the current vault, THE Frontend_Application SHALL immediately invalidate cached data and refetch vault state
3. WHEN a Redeemed event is emitted for the current vault, THE Frontend_Application SHALL immediately invalidate cached data and refetch vault state
4. WHEN a StageUnlocked event is emitted for the current vault, THE Frontend_Application SHALL immediately invalidate cached data and refetch vault state
5. WHEN a LiquidationExecuted event is emitted for the current vault, THE Frontend_Application SHALL immediately invalidate cached data and refetch vault state
6. WHEN an AuraUpdated event is emitted from the oracle for the current vault, THE Frontend_Application SHALL immediately refetch aura and recalculate peg and supply cap
7. WHEN data is refetching, THE Frontend_Application SHALL maintain the previous data display and show a subtle loading indicator (not full skeleton)

### Requirement 13: Environment-Based Configuration

**User Story:** As a developer, I want the frontend to support both Anvil local development and Sepolia testnet with environment-based configuration, so that I can test locally and deploy to testnet without code changes.

#### Acceptance Criteria

1. WHEN the Frontend_Application initializes, THE Frontend_Application SHALL read NEXT_PUBLIC_NETWORK from environment variables to determine the target network (anvil or sepolia)
2. WHEN NEXT_PUBLIC_NETWORK = "anvil", THE Frontend_Application SHALL configure wagmi with Anvil local chain (Chain ID: 31337, RPC: http://localhost:8545)
3. WHEN NEXT_PUBLIC_NETWORK = "sepolia", THE Frontend_Application SHALL configure wagmi with Sepolia testnet (Chain ID: 11155111, RPC from NEXT_PUBLIC_RPC_URL)
4. WHEN the Frontend_Application loads contract addresses, THE Frontend_Application SHALL read from environment-specific configuration (ANVIL_ADDRESSES or SEPOLIA_ADDRESSES based on NEXT_PUBLIC_NETWORK)
5. WHEN contract addresses are loaded, THE Frontend_Application SHALL validate that no address is a placeholder (0x0000000000000000000000000000000000000000)
6. IF any address is a placeholder, THEN THE Frontend_Application SHALL display an error message "Contract addresses not configured for [network]"
7. WHEN the Frontend_Application is built for production, THE Frontend_Application SHALL use .env.production values for Sepolia deployment

### Requirement 14: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages and feedback when transactions fail or validation errors occur, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a transaction reverts with "InsufficientCollateral", THE Frontend_Application SHALL display error message "Not enough CELO. Please add more collateral."
2. WHEN a transaction reverts with "StageNotUnlocked", THE Frontend_Application SHALL display error message "Vault not bootstrapped. Creator must deposit 0.001 CELO first."
3. WHEN a transaction reverts with "ExceedsStageCap", THE Frontend_Application SHALL display error message "Stage capacity reached. Wait for creator to unlock next stage."
4. WHEN a transaction reverts with "ExceedsSupplyCap", THE Frontend_Application SHALL display error message "Supply cap reached due to low aura. Wait for aura to increase."
5. WHEN a transaction reverts with "HealthTooLow", THE Frontend_Application SHALL display error message "This action would drop vault health below 150%. Reduce quantity or add more collateral."
6. WHEN a transaction reverts with "NotLiquidatable", THE Frontend_Application SHALL display error message "Vault health is above 120%. Liquidation not needed."
7. WHEN a transaction fails for unknown reasons, THE Frontend_Application SHALL display error message "Transaction failed. Please try again." and log the full error to console
8. WHEN displaying error messages, THE Frontend_Application SHALL use toast notifications that auto-dismiss after 5 seconds

### Requirement 15: Oracle API Integration

**User Story:** As a creator, I want my vault's aura score to be automatically calculated and updated on-chain after vault creation, so that my token peg and supply cap reflect my Farcaster engagement.

#### Acceptance Criteria

1. WHEN the Frontend_Application needs to calculate aura, THE Frontend_Application SHALL call the `/api/oracle/calculate-aura` API route with vault address and Farcaster username
2. WHEN the API route receives a request, THE Frontend_Application SHALL validate that vault address is a valid Ethereum address and username is non-empty
3. WHEN validation passes, THE Frontend_Application SHALL resolve the Farcaster username to FID using Neynar API or fallback to mock data
4. WHEN FID is resolved, THE Frontend_Application SHALL fetch Farcaster metrics (followers, engagement, verification status) using Neynar API
5. WHEN metrics are fetched, THE Frontend_Application SHALL compute the aura score using the same algorithm as oracle.js (weighted sum with normalization)
6. WHEN aura is computed, THE Frontend_Application SHALL pin the metrics data to IPFS using Pinata API
7. WHEN IPFS pinning succeeds, THE Frontend_Application SHALL call the AuraOracle contract's pushAura function with vault address, aura score, and IPFS hash
8. WHEN the oracle transaction succeeds, THE Frontend_Application SHALL return success response with aura score and transaction hash
9. IF any step fails, THEN THE Frontend_Application SHALL return appropriate error response with details for debugging
10. WHEN using environment variables, THE Frontend_Application SHALL read NEYNAR_API_KEY, PINATA_JWT, ORACLE_PRIVATE_KEY, and contract addresses from server-side environment

### Requirement 16: Responsive Design and Mobile Support

**User Story:** As a mobile user, I want the frontend to work well on my phone or tablet, so that I can interact with the protocol on any device.

#### Acceptance Criteria

1. WHEN a user views the application on a mobile device (width < 768px), THE Frontend_Application SHALL display a single-column layout for vault cards
2. WHEN a user views the application on a tablet (width 768px-1024px), THE Frontend_Application SHALL display a two-column layout for vault cards
3. WHEN a user views the application on desktop (width > 1024px), THE Frontend_Application SHALL display a three-column layout for vault cards
4. WHEN a user views forms on mobile, THE Frontend_Application SHALL stack form fields vertically with full-width inputs
5. WHEN a user views tables on mobile, THE Frontend_Application SHALL make tables horizontally scrollable or convert to card layout
6. WHEN a user interacts with buttons on mobile, THE Frontend_Application SHALL ensure touch targets are at least 44x44 pixels
7. WHEN a user views the application on any device, THE Frontend_Application SHALL maintain readable font sizes (minimum 16px for body text)
