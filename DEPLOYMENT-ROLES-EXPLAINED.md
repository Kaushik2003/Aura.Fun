# AuraFi Deployment - Role-Based Explanation

## Overview: Who Does What?

The AuraFi protocol involves **4 key roles** during deployment and operation. Here's what each role does and why.

---

## 🏗️ Role 1: Protocol Deployer (Admin/Owner)

**Who**: The team/person deploying the AuraFi protocol infrastructure  
**Account**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (Anvil account #0)  
**Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### What They Do:

#### 1. Deploy Core Contracts (One-Time Setup)
```bash
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY
```

**Deploys:**
- **Treasury**: Collects 0.5% protocol fees from all mints
- **AuraOracle**: Stores aura scores for all vaults (single source of truth)
- **VaultFactory**: Factory contract that creates new creator vaults

**Why**: These are shared infrastructure that all creators use. Only deployed once.

#### 2. Act as Oracle (Ongoing)
```bash
cast send $ORACLE "pushAura(address,uint256,string)" $VAULT 136 "QmHash..." --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

**What**: Updates aura scores for creator vaults every 6+ hours
**Why**: Oracle address is set to deployer by default (in production, this would be a dedicated oracle service)

#### 3. Manage Protocol (Ongoing)
- Pause/unpause vaults in emergencies
- Update oracle address if needed
- Withdraw protocol fees from Treasury

**Key Point**: The deployer does NOT create individual creator vaults - creators do that themselves!

---

## 🎨 Role 2: Creator

**Who**: Content creator who wants to launch their own token  
**Account**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (Anvil account #1)  
**Private Key**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

### What They Do:

#### 1. Create Their Vault (One-Time)
```bash
cast send $FACTORY \
  "createVault(string,string,address,uint256)" \
  "CreatorToken" "CRTR" $CREATOR "1000000000000000000000" \
  --rpc-url $RPC_URL \
  --private-key $CREATOR_KEY
```

**Parameters:**
- `"CreatorToken"`: Token name (e.g., "Alice's Token")
- `"CRTR"`: Token symbol (e.g., "ALICE")
- `$CREATOR`: Creator's wallet address (receives creator role)
- `1000000000000000000000`: Base capacity (1000 tokens in wei)

**Result**: 
- New CreatorVault contract deployed
- New CreatorToken (ERC20) contract deployed
- Creator is set as the vault owner

**Why**: Each creator gets their own isolated vault + token pair. The factory ensures proper configuration.

#### 2. Bootstrap Their Vault (Required Before Fans Can Mint)
```bash
cast send $VAULT \
  "bootstrapCreatorStake()" \
  --value 100ether \
  --rpc-url $RPC_URL \
  --private-key $CREATOR_KEY
```

**What**: Creator deposits 100 CELO to unlock Stage 1
**Why**: 
- Proves creator commitment (skin in the game)
- Unlocks minting capacity for fans (500 tokens at Stage 1)
- Creator's collateral backs the token supply

**Stage Progression:**
- Stage 0: Vault created, no minting allowed (0 CELO)
- Stage 1: 100 CELO → 500 tokens capacity
- Stage 2: 300 CELO total → 2,500 tokens capacity
- Stage 3: 800 CELO total → 9,500 tokens capacity
- Stage 4: 1,800 CELO total → 34,500 tokens capacity

#### 3. Unlock Higher Stages (Optional)
```bash
cast send $VAULT "unlockStage()" --value 200ether --rpc-url $RPC_URL --private-key $CREATOR_KEY
```

**What**: Deposit additional CELO to unlock next stage
**Example**: Already at Stage 1 (100 CELO), deposit 200 more CELO → Stage 2 (300 CELO total)

**Why**: More capacity = more fans can mint = bigger economy

#### 4. Monitor Vault Health
```bash
cast call $VAULT "getVaultState()" --rpc-url $RPC_URL
```

**What**: Check vault health, collateral, supply, peg
**Why**: Avoid liquidation (health must stay above 120%)

---

## 👥 Role 3: Fans (Token Buyers)

**Who**: People who want to buy creator tokens  
**Accounts**: 
- Fan1: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` (Anvil account #2)
- Fan2: `0x90F79bf6EB2c4f870365E785982E1f101E93b906` (Anvil account #3)

### What They Do:

#### 1. Check Current Peg (Before Minting)
```bash
cast call $VAULT "getPeg()" --rpc-url $RPC_URL
```

**What**: Get current token price in CELO
**Example**: Returns `1180000000000000000` = 1.18 CELO per token

#### 2. Mint Tokens
```bash
cast send $VAULT \
  "mintTokens(uint256)" \
  "50000000000000000000" \
  --value 90ether \
  --rpc-url $RPC_URL \
  --private-key $FAN1_KEY
```

**Parameters:**
- `"50000000000000000000"`: Quantity (50 tokens in wei)
- `--value 90ether`: CELO payment (must be ≥ qty × peg × 1.5 × 1.005)

**Calculation:**
```
Required = qty × peg × MIN_CR × (1 + fee)
         = 50 × 1.18 × 1.5 × 1.005
         = 88.9425 CELO
         ≈ 90 CELO (with buffer)
```

**Result:**
- Fan receives 50 creator tokens
- 0.5% fee goes to Treasury
- Remaining CELO added to vault collateral
- Position created tracking fan's mint

#### 3. Check Token Balance
```bash
cast call $TOKEN "balanceOf(address)(uint256)" $FAN1 --rpc-url $RPC_URL
```

**What**: See how many tokens you own

#### 4. Redeem Tokens (Exit)
```bash
cast send $VAULT \
  "redeemTokens(uint256)" \
  "25000000000000000000" \
  --rpc-url $RPC_URL \
  --private-key $FAN1_KEY
```

**What**: Burn 25 tokens, get CELO back (proportional to your position's collateral)
**Why**: Exit if you think creator will decline, or take profits

---

## 🔮 Role 4: Oracle Service

**Who**: Automated service that fetches Farcaster metrics and updates aura  
**Account**: Same as deployer in MVP (in production, separate dedicated account)

### What They Do:

#### 1. Fetch Farcaster Metrics (Off-Chain)
```bash
cd oracle
node oracle.js --vault $VAULT --fid $CREATOR_FID
```

**What**: 
- Fetches followers, engagement, verification from Farcaster
- Computes aura score (0-200)
- Pins metrics to IPFS as evidence

#### 2. Push Aura On-Chain
```bash
cast send $ORACLE \
  "pushAura(address,uint256,string)" \
  $VAULT 136 "QmIPFSHash..." \
  --rpc-url $RPC_URL \
  --private-key $ORACLE_KEY
```

**Parameters:**
- `$VAULT`: Which creator vault to update
- `136`: Computed aura score
- `"QmIPFSHash..."`: IPFS hash with metrics evidence

**Result:**
- Aura stored in AuraOracle contract
- Vault's peg and supply cap automatically adjust
- 6-hour cooldown starts (prevents spam)

#### 3. Monitor Multiple Vaults
```bash
# Update all creator vaults every 6 hours
for vault in $(cat vaults.txt); do
  node oracle.js --vault $vault --fid $(get_fid $vault)
  sleep 60
done
```

---

## 📊 Complete Flow Example

### Initial Setup (One-Time)

```
1. DEPLOYER deploys infrastructure
   ├─ Treasury deployed
   ├─ AuraOracle deployed
   └─ VaultFactory deployed

2. CREATOR creates their vault
   ├─ Calls VaultFactory.createVault()
   ├─ Gets new CreatorVault address
   └─ Gets new CreatorToken address

3. CREATOR bootstraps vault
   ├─ Deposits 100 CELO
   ├─ Unlocks Stage 1
   └─ Vault ready for fans

4. ORACLE sets initial aura
   ├─ Fetches Farcaster metrics
   ├─ Computes aura = 136
   ├─ Pushes to AuraOracle
   └─ Peg = 1.18 CELO, Cap = 1270 tokens
```

### Ongoing Operations

```
5. FAN1 mints tokens
   ├─ Checks peg (1.18 CELO)
   ├─ Deposits 90 CELO
   ├─ Receives 50 tokens
   └─ Position created

6. ORACLE updates aura (6 hours later)
   ├─ Creator gained followers
   ├─ New aura = 175
   ├─ Peg increases to 1.375 CELO
   └─ Cap increases to 1900 tokens

7. FAN2 mints at higher price
   ├─ Checks new peg (1.375 CELO)
   ├─ Deposits 125 CELO
   ├─ Receives 60 tokens
   └─ Pays more than Fan1 did

8. ORACLE updates aura (6 hours later)
   ├─ Creator lost followers
   ├─ New aura = 40
   ├─ Peg drops to 0.7 CELO
   └─ Cap shrinks to 550 tokens

9. ANYONE triggers forced burn
   ├─ Supply (110 tokens) > Cap (550 tokens)
   ├─ 24-hour grace period starts
   ├─ Fans can redeem during grace
   └─ After 24h, burn executes pro-rata
```

---

## 🎯 Key Takeaways

### Who Creates Vaults?
**CREATORS** create their own vaults by calling `VaultFactory.createVault()`

### Who Deploys Infrastructure?
**DEPLOYER** (protocol team) deploys Treasury, Oracle, and Factory once

### Who Updates Aura?
**ORACLE** (automated service) fetches metrics and pushes aura every 6+ hours

### Who Mints Tokens?
**FANS** mint tokens by depositing CELO at 150% collateralization

### Who Can Trigger Forced Burns?
**ANYONE** can call `checkAndTriggerForcedBurn()` and `executeForcedBurn()` (permissionless)

### Who Can Liquidate?
**ANYONE** can call `liquidate()` when vault health < 120% (permissionless)

---

## 🔐 Security Model

| Role | Trust Level | Why |
|------|-------------|-----|
| **Deployer** | Trusted | Can pause vaults, update oracle address (admin functions) |
| **Oracle** | Semi-trusted | Can update aura, but all updates are on-chain with IPFS evidence |
| **Creator** | Untrusted | Can't rug-pull (collateral locked), penalized in liquidations |
| **Fans** | Untrusted | Can mint/redeem freely, protected by forced burns and liquidations |
| **Liquidators** | Untrusted | Permissionless, incentivized by bounties |

---

## 📝 Summary Table

| Action | Who | When | Why |
|--------|-----|------|-----|
| Deploy contracts | Deployer | Once | Set up infrastructure |
| Create vault | Creator | Once per creator | Launch their token |
| Bootstrap stake | Creator | Once | Unlock minting |
| Unlock stages | Creator | Optional | Increase capacity |
| Set initial aura | Oracle | After vault creation | Enable minting |
| Update aura | Oracle | Every 6+ hours | Track reputation |
| Mint tokens | Fans | Anytime | Buy creator tokens |
| Redeem tokens | Fans | Anytime | Exit position |
| Trigger forced burn | Anyone | When supply > cap | Maintain peg |
| Execute forced burn | Anyone | After 24h grace | Burn excess supply |
| Liquidate | Anyone | When health < 120% | Restore solvency |

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-25
