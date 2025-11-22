# Implementation Plan

- [x] 1. Set up Next.js project and core dependencies





  - Initialize Next.js 15 project with TypeScript and App Router
  - Install and configure Tailwind CSS
  - Install Web3 dependencies (wagmi v2, viem v2, RainbowKit v2, TanStack Query v5)
  - Install UI dependencies (Radix UI, Lucide React, Sonner, React Hook Form, Zod)
  - Configure TypeScript with strict mode
  - _Requirements: 13.1, 13.2_

- [x] 2. Configure environment-based network setup





  - Create `.env.local` template with Anvil configuration
  - Create `.env.production` template with Sepolia configuration
  - Add oracle-specific environment variables (NEYNAR_API_KEY, PINATA_JWT, ORACLE_PRIVATE_KEY)
  - Implement `lib/config.ts` with environment variable validation
  - Create `lib/wagmi-config.ts` with network-specific chain configuration
  - Implement `getContractAddress()` helper function
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 15.10_

- [x] 3. Set up providers and root layout





  - Create `app/providers.tsx` with Wagmi, RainbowKit, and TanStack Query providers
  - Configure TanStack Query with 10-second polling interval
  - Create `app/layout.tsx` with providers and global styles
  - Add Toaster component from Sonner
  - _Requirements: 1.1, 12.1_

- [x] 4. Implement contract ABIs and type definitions





  - Create `lib/abis.ts` with VAULT_ABI, FACTORY_ABI, ORACLE_ABI, TOKEN_ABI, TREASURY_ABI
  - Create `types/vault.ts` with VaultState, Position, VaultMetrics interfaces
  - Create `types/treasury.ts` with TreasuryEvent interface
  - _Requirements: All requirements use contract interactions_

- [x] 5. Create wallet connection and network management





  - Implement `components/wallet-connect.tsx` with RainbowKit integration
  - Add wrong network detection and switch network functionality
  - Display user address (truncated) and CELO balance
  - Implement disconnect functionality
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 6. Build navigation component with role-based links





  - Create `components/navigation.tsx` with adaptive navigation
  - Add links for Browse Vaults, Creator Dashboard, Liquidate, Admin
  - Implement active route highlighting
  - Add role detection (creator check, admin check)
  - Integrate WalletConnect component
  - _Requirements: 1.1, 13.1_
-

- [x] 7. Implement core data fetching hooks




  - Create `hooks/use-vaults.ts` to fetch all vaults from VaultFactory
  - Create `hooks/use-vault-state.ts` to fetch single vault state with polling
  - Create `hooks/use-user-positions.ts` to fetch user positions with FIFO ordering
  - Create `hooks/use-creator-vaults.ts` to filter vaults by creator
  - Add event watchers for real-time updates (Minted, Redeemed, StageUnlocked, AuraUpdated)
  - _Requirements: 2.1, 3.1, 6.1, 6.2, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [x] 8. Create utility functions and helpers





  - Implement `lib/calculations.ts` with calculatePeg() and calculateSupplyCap()
  - Create `lib/error-parser.ts` with parseContractError() and error mapping
  - Implement `lib/toast-config.ts` with toast wrapper functions
  - Create `hooks/use-network-config.ts` for network detection
  - Add formatAddress() helper function
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

- [x] 9. Build fan vault discovery page





  - Create `app/vaults/page.tsx` with vault browsing interface
  - Implement `components/vault-filters.tsx` for filtering and sorting
  - Create `components/fan-vault-card.tsx` with investment metrics
  - Add skeleton loading states
  - Implement responsive grid layout (1/2/3 columns)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 15.1, 15.2, 15.3_
-

- [x] 10. Build fan vault detail// page




  - Create `app/vaults/[address]/page.tsx` with vault detail view
  - Implement `components/fan-vault-metrics.tsx` showing investment data
  - Create `components/aura-chart.tsx` with visual aura gauge
  - Add forced burn alert display
  - Show bootstrap status message when stage = 0
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 11. Implement fan minting functionality





  - Create `components/mint-form.tsx` with quantity input and validation
  - Calculate and display required collateral, mint fee, and total cost
  - Implement client-side validation (stage check, stage cap, supply cap)
  - Add transaction submission with error handling
  - Display loading states and success/error toasts
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 12. Implement fan redemption functionality





  - Create `components/redeem-form.tsx` with quantity input
  - Implement FIFO calculation for estimated return
  - Add balance check and health validation
  - Implement two-step approval + redeem flow
  - Display loading states and success/error toasts
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
-

- [x] 13. Build user positions display




  - Create `components/user-positions.tsx` with position table
  - Fetch positions using getPositionCount() and getPosition()
  - Display positions in FIFO order with visual indication
  - Filter out redeemed positions (qty = 0)
  - Format dates and amounts
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 14. Create creator dashboard





  - Create `app/creator/page.tsx` with creator vault overview
  - Implement `components/creator-stats.tsx` with aggregate metrics
  - Create `components/creator-vault-card.tsx` with management metrics
  - Add "Create New Vault" button
  - Show empty state for new creators
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 15. Build oracle API route for aura calculation





  - Create `app/api/oracle/calculate-aura/route.ts` with POST endpoint
  - Implement resolveFarcasterUsername() function using Neynar API
  - Implement fetchFarcasterMetrics() function with mock fallback
  - Implement computeAura() function with exact oracle.js algorithm
  - Implement pinToIPFS() function using Pinata API
  - Implement updateVaultAura() function to call AuraOracle contract
  - Add comprehensive error handling and validation
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10_

- [x] 16. Build vault creation flow with oracle integration





  - Create `app/creator/create/page.tsx` with vault creation form
  - Add Farcaster username field to form validation (name, symbol, baseCap, username)
  - Add VaultCreated event listener to extract vault address
  - Implement automatic aura calculation after vault creation
  - Display loading states for vault creation and aura calculation
  - Display success screen with vault address, token address, and initial aura score
  - Add error handling for aura calculation failures with manual retry option
  - Add "Go to Vault" navigation button
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_

- [x] 17. Implement creator vault management page





  - Create `app/creator/vaults/[address]/page.tsx` with management view
  - Implement `components/creator-vault-metrics.tsx` with collateral breakdown
  - Create `components/vault-analytics.tsx` with visual analytics
  - Add access control to redirect non-creators
  - Display vault status information
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
-

- [x] 18. Build bootstrap functionality




  - Create `components/bootstrap-form.tsx` with CELO input
  - Pre-fill with 0.001 CELO minimum requirement
  - Add validation for minimum amount
  - Implement bootstrapCreatorStake() transaction
  - Display success message and update stage
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 19. Implement stage unlocking





  - Create `components/stage-unlock-form.tsx` with progress bar
  - Display current stage, next stage requirements, and progress
  - Pre-fill with remaining amount needed
  - Add validation for sufficient amount
  - Implement unlockStage() transaction
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 20. Build forced burn alert system





  - Create `components/forced-burn-alert.tsx` with prominent warning
  - Display pending burn amount, new supply cap, and countdown timer
  - Implement countdown timer that updates every minute
  - Add "Check Forced Burn" button
  - Listen for SupplyCapShrink events
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 21. Create liquidation dashboard






  - Create `app/liquidate/page.tsx` with liquidatable vaults
  - Filter vaults with health < 120%
  - Create `components/liquidation-card.tsx` with liquidation form
  - Calculate tokens to remove, bounty, and penalty
  - Implement liquidate() transaction
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [x] 22. Build admin panel for treasury management






  - Create `app/admin/page.tsx` with owner-only access control
  - Implement `components/treasury-stats.tsx` with balance and totals
  - Create `components/withdrawal-form.tsx` with validation
  - Implement `components/fee-history-table.tsx` with event display
  - Create `hooks/use-treasury-balance.ts` with real-time updates
  - Create `hooks/use-treasury-events.ts` to fetch all treasury events
  - _Requirements: Admin panel (new requirement)_

- [ ] 23. Implement responsive design
  - Add mobile-responsive navigation with hamburger menu
  - Implement responsive grid layouts (1/2/3 columns)
  - Make forms stack vertically on mobile
  - Add horizontal scroll for tables on mobile
  - Ensure touch targets are 44x44 pixels minimum
  - Test on mobile, tablet, and desktop viewports
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [x] 24. Add error boundary and error handling






  - Create `components/error-boundary.tsx` for React errors
  - Implement comprehensive error parsing in parseContractError()
  - Add user-friendly error messages for all contract errors
  - Test error scenarios (insufficient balance, wrong network, etc.)
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

- [x] 25. Create landing page






  - Create `app/page.tsx` with protocol overview
  - Add hero section explaining AuraFi
  - Display key metrics (total vaults, TVL)
  - Add call-to-action buttons (Browse Vaults, Create Vault)
  - _Requirements: General UX_

- [x] 26. Deploy and test on Anvil















  - Start local Anvil instance
  - Deploy contracts using Foundry
  - Update `.env.local` with deployed addresses
  - Test all user flows (create vault, mint, redeem, liquidate, admin)
  - Verify real-time updates work correctly
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 27. Deploy and test on Sepolia
  - Deploy contracts to Sepolia testnet
  - Update `.env.production` with deployed addresses
  - Build production bundle
  - Deploy to Vercel/Netlify
  - Test all user flows on testnet
  - _Requirements: 13.3, 13.7_
