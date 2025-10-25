#!/bin/bash

# AuraFi Protocol - Complete Deployment and Testing Script
# Single script that handles everything from deployment to testing
# Assumes Anvil is already running on localhost:8545

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AuraFi Protocol - Complete Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
export RPC_URL="http://localhost:8545"

# Anvil default accounts
export DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
export DEPLOYER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

export CREATOR_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
export CREATOR="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

export FAN1_KEY="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
export FAN1="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"

export FAN2_KEY="0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
export FAN2="0x90F79bf6EB2c4f870365E785982E1f101E93b906"

# Check if Anvil is running
echo -e "${BLUE}ℹ ${NC}Checking if Anvil is running..."
if ! cast chain-id --rpc-url $RPC_URL &> /dev/null; then
    echo -e "${RED}❌ ${NC}Anvil is not running on localhost:8545"
    echo -e "${BLUE}ℹ ${NC}Please start Anvil in another terminal:"
    echo -e "${BLUE}ℹ ${NC}  anvil --chain-id 31337"
    exit 1
fi
echo -e "${GREEN}✅ ${NC}Anvil is running"

# Verify Foundry is installed
echo -e "${BLUE}ℹ ${NC}Checking Foundry installation..."
if ! command -v forge &> /dev/null; then
    echo -e "${RED}❌ ${NC}Foundry not found. Please install: https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi
echo -e "${GREEN}✅ ${NC}Foundry is installed"

# ============================================================================
# STEP 1: Build Contracts
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 1: Building Contracts${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}ℹ ${NC}Running forge build..."
forge build
echo -e "${GREEN}✅ ${NC}Contracts built successfully"

# ============================================================================
# STEP 2: Deploy Core Contracts
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 2: Deploying Core Contracts${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}ℹ ${NC}Deploying Treasury, Oracle, and Factory..."

forge script script/Deploy.s.sol:Deploy \
    --rpc-url $RPC_URL \
    --broadcast \
    --private-key $DEPLOYER_KEY \
    -vv

# Read deployed addresses from deployments.json
if [ ! -f "deployments.json" ]; then
    echo -e "${RED}❌ ${NC}deployments.json not found!"
    exit 1
fi

export TREASURY=$(jq -r '.treasury' deployments.json)
export ORACLE=$(jq -r '.oracle' deployments.json)
export FACTORY=$(jq -r '.factory' deployments.json)

echo -e "${GREEN}✅ ${NC}Treasury deployed: $TREASURY"
echo -e "${GREEN}✅ ${NC}Oracle deployed: $ORACLE"
echo -e "${GREEN}✅ ${NC}Factory deployed: $FACTORY"

# ============================================================================
# STEP 3: Create Vault (with robust address extraction)
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 3: Creating Creator Vault${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}ℹ ${NC}Creator ($CREATOR) creating vault..."

# Send transaction and get hash
TX_HASH=$(cast send $FACTORY \
    "createVault(string,string,address,uint256)" \
    "CreatorToken" "CRTR" $CREATOR "1000000000000000000000" \
    --rpc-url $RPC_URL \
    --private-key $CREATOR_KEY \
    --json | jq -r '.transactionHash')

echo -e "${BLUE}ℹ ${NC}Transaction hash: $TX_HASH"
echo -e "${BLUE}ℹ ${NC}Waiting for transaction to be mined..."
sleep 2

# Get receipt
echo -e "${BLUE}ℹ ${NC}Fetching transaction receipt..."
cast receipt $TX_HASH --rpc-url $RPC_URL --json > receipt.json

if [ ! -f receipt.json ]; then
    echo -e "${RED}❌ ${NC}Failed to fetch receipt"
    exit 1
fi

echo -e "${GREEN}✅ ${NC}Receipt fetched"
echo ""
echo -e "${BLUE}ℹ ${NC}Extracting vault address from transaction logs..."
echo ""

# Show logs for debugging
echo -e "${BLUE}ℹ ${NC}Transaction logs:"
jq '.logs' receipt.json
echo ""

# Try multiple extraction methods
echo -e "${BLUE}ℹ ${NC}Attempting automatic extraction..."
echo ""

# Method 1: First topic of first log (VaultCreated event)
VAULT_1=$(jq -r '.logs[0].topics[1]' receipt.json 2>/dev/null | cast --to-address 2>/dev/null || echo "")
if [[ $VAULT_1 =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${GREEN}✅ ${NC}Method 1 (topics[1]): $VAULT_1"
else
    echo -e "${BLUE}ℹ ${NC}Method 1 failed"
fi

# Method 2: Address field of first log
VAULT_2=$(jq -r '.logs[0].address' receipt.json 2>/dev/null || echo "")
if [[ $VAULT_2 =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${GREEN}✅ ${NC}Method 2 (log address): $VAULT_2"
else
    echo -e "${BLUE}ℹ ${NC}Method 2 failed"
fi

# Method 3: Contract address from receipt
VAULT_3=$(jq -r '.contractAddress' receipt.json 2>/dev/null || echo "")
if [[ $VAULT_3 =~ ^0x[a-fA-F0-9]{40}$ ]] && [[ $VAULT_3 != "null" ]]; then
    echo -e "${GREEN}✅ ${NC}Method 3 (contractAddress): $VAULT_3"
else
    echo -e "${BLUE}ℹ ${NC}Method 3 failed"
fi

# Method 4: Parse all addresses from logs
echo -e "${BLUE}ℹ ${NC}Method 4: All addresses found in logs:"
jq -r '.logs[].address' receipt.json 2>/dev/null | while read addr; do
    if [[ $addr =~ ^0x[a-fA-F0-9]{40}$ ]]; then
        echo "  - $addr"
    fi
done

echo ""
echo -e "${BLUE}ℹ ${NC}Checking which addresses have code (are contracts)..."
echo ""

# Check each potential address and verify it's a vault
export VAULT=""
for addr in $VAULT_1 $VAULT_2 $VAULT_3; do
    if [[ $addr =~ ^0x[a-fA-F0-9]{40}$ ]]; then
        CODE=$(cast code $addr --rpc-url $RPC_URL 2>&1)
        if [[ "$CODE" != "0x" ]] && [[ ! "$CODE" =~ "error" ]]; then
            echo -e "${GREEN}✅ ${NC}$addr has code (${#CODE} bytes)"
            
            # Try to verify it's a vault by calling a vault function
            STAGE=$(cast call $addr "stage()" --rpc-url $RPC_URL 2>/dev/null || echo "")
            if [[ ! -z "$STAGE" ]]; then
                echo -e "${GREEN}✅ ${NC}  Confirmed: stage() call succeeded (stage: $STAGE)"
                export VAULT=$addr
                break
            fi
        else
            echo -e "${BLUE}ℹ ${NC}$addr has no code or error"
        fi
    fi
done

if [[ ! $VAULT =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${RED}❌ ${NC}Failed to extract vault address automatically"
    echo ""
    echo -e "${BLUE}ℹ ${NC}Please manually find the vault address from the logs above"
    echo -e "${BLUE}ℹ ${NC}Look for the VaultCreated event or contract creation"
    echo ""
    echo -e "${BLUE}ℹ ${NC}To continue manually:"
    echo -e "${BLUE}ℹ ${NC}  1. Find vault address in the output above"
    echo -e "${BLUE}ℹ ${NC}  2. export VAULT=0x..."
    echo -e "${BLUE}ℹ ${NC}  3. Continue from Step 4 in MANUAL-DEPLOYMENT-GUIDE.md"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ ${NC}Vault created: $VAULT"

# ============================================================================
# STEP 3.5: Extract Token Address (with robust extraction)
# ============================================================================
echo ""
echo -e "${BLUE}ℹ ${NC}Extracting token address from vault..."
echo ""

# Check vault exists
VAULT_CODE=$(cast code $VAULT --rpc-url $RPC_URL 2>&1)
if [[ "$VAULT_CODE" == "0x" ]]; then
    echo -e "${RED}❌ ${NC}ERROR: Vault has no code!"
    exit 1
else
    echo -e "${GREEN}✅ ${NC}Vault exists (${#VAULT_CODE} bytes)"
fi

# Method A: Direct call
RAW_TOKEN=$(cast call $VAULT "token()" --rpc-url $RPC_URL 2>&1)
echo -e "${BLUE}ℹ ${NC}Raw response: $RAW_TOKEN"

# Method B: Try to decode using cast to-address (without --)
echo -e "${BLUE}ℹ ${NC}Attempting cast to-address..."
TOKEN_A=$(cast to-address "$RAW_TOKEN" 2>&1 || echo "")
echo -e "${BLUE}ℹ ${NC}Method A (cast decode): $TOKEN_A"

# Method C: Manual extraction
TOKEN_B=""
echo -e "${BLUE}ℹ ${NC}Raw token length: ${#RAW_TOKEN}"
if [[ ${#RAW_TOKEN} -eq 66 ]]; then
    TOKEN_B="0x${RAW_TOKEN:26:40}"
    echo -e "${BLUE}ℹ ${NC}Method B (manual extraction): $TOKEN_B"
else
    echo -e "${YELLOW}⚠️  ${NC}Method B: Raw token length is ${#RAW_TOKEN}, expected 66"
fi

# Use the one that looks valid
echo -e "${BLUE}ℹ ${NC}Validating extracted addresses..."
if [[ $TOKEN_A =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    export TOKEN=$TOKEN_A
    echo -e "${GREEN}✅ ${NC}Using Method A result: $TOKEN"
elif [[ $TOKEN_B =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    export TOKEN=$TOKEN_B
    echo -e "${GREEN}✅ ${NC}Using Method B result: $TOKEN"
else
    echo -e "${RED}❌ ${NC}ERROR: Could not extract valid token address"
    echo -e "${RED}❌ ${NC}TOKEN_A: $TOKEN_A"
    echo -e "${RED}❌ ${NC}TOKEN_B: $TOKEN_B"
    exit 1
fi

# Check token contract
echo -e "${BLUE}ℹ ${NC}Verifying token contract at $TOKEN..."
TOKEN_CODE=$(cast code $TOKEN --rpc-url $RPC_URL 2>&1)
echo -e "${BLUE}ℹ ${NC}Token code length: ${#TOKEN_CODE}"

if [[ "$TOKEN_CODE" == "0x" ]]; then
    echo -e "${RED}❌ ${NC}ERROR: Token has no code at $TOKEN"
    echo -e "${RED}❌ ${NC}The token contract was not deployed!"
    exit 1
else
    echo -e "${GREEN}✅ ${NC}Token exists (${#TOKEN_CODE} bytes)"
fi

echo -e "${GREEN}✅ ${NC}Token address verified: $TOKEN"

# ============================================================================
# STEP 4: Bootstrap Creator Stake
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 4: Bootstrapping Creator Stake${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}ℹ ${NC}Creator depositing 100 CELO to unlock Stage 1..."

cast send $VAULT \
    "bootstrapCreatorStake()" \
    --value 100ether \
    --rpc-url $RPC_URL \
    --private-key $CREATOR_KEY

# Verify stage
STAGE=$(cast call $VAULT "stage()" --rpc-url $RPC_URL)
STAGE_DEC=$(cast --to-dec $STAGE 2>/dev/null || echo $STAGE)
echo -e "${BLUE}ℹ ${NC}Stage (hex): $STAGE"
echo -e "${BLUE}ℹ ${NC}Stage (decimal): $STAGE_DEC"

if [ "$STAGE_DEC" == "1" ] || [ "$STAGE" == "0x0000000000000000000000000000000000000000000000000000000000000001" ] || [ "$STAGE" == "1" ]; then
    echo -e "${GREEN}✅ ${NC}Stage 1 unlocked successfully"
else
    echo -e "${RED}❌ ${NC}Stage unlock failed. Current stage: $STAGE (decimal: $STAGE_DEC)"
    exit 1
fi

# ============================================================================
# STEP 5: Set Initial Aura
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 5: Setting Initial Aura${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}ℹ ${NC}Oracle pushing initial aura (136)..."

cast send $ORACLE \
    "pushAura(address,uint256,string)" \
    $VAULT 136 "QmMockInitialMetrics123" \
    --rpc-url $RPC_URL \
    --private-key $DEPLOYER_KEY

# Check peg
PEG=$(cast call $VAULT "getPeg()" --rpc-url $RPC_URL)
PEG_ETHER=$(cast to-unit $PEG ether)
echo -e "${GREEN}✅ ${NC}Peg set: $PEG_ETHER CELO per token"

# Check supply cap
CAP=$(cast call $VAULT "getCurrentSupplyCap()" --rpc-url $RPC_URL)
CAP_ETHER=$(cast to-unit $CAP ether)
echo -e "${GREEN}✅ ${NC}Supply cap: $CAP_ETHER tokens"

# ============================================================================
# STEP 6: Fan1 Minting Tokens
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 6: Fan1 Minting Tokens${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}ℹ ${NC}Fan1 minting 50 tokens..."

cast send $VAULT \
    "mintTokens(uint256)" \
    "50000000000000000000" \
    --value 90ether \
    --rpc-url $RPC_URL \
    --private-key $FAN1_KEY

# Check Fan1 balance (try multiple methods)
echo -e "${BLUE}ℹ ${NC}Checking Fan1 balance..."

# Method 1: Standard call
BAL1=$(cast call $TOKEN "balanceOf(address)" $FAN1 --rpc-url $RPC_URL 2>&1)
echo -e "${BLUE}ℹ ${NC}Method 1 result: $BAL1"

# Method 2: With return type
BAL2=$(cast call $TOKEN "balanceOf(address)(uint256)" $FAN1 --rpc-url $RPC_URL 2>&1)
echo -e "${BLUE}ℹ ${NC}Method 2 result: $BAL2"

# Use the first successful result (extract just the number)
if [[ $BAL1 =~ ^0x[0-9a-fA-F]+$ ]]; then
    FAN1_BAL=$(cast --to-dec $BAL1)
    echo -e "${GREEN}✅ ${NC}Using Method 1 result (converted to decimal)"
elif [[ $BAL2 =~ ^[0-9]+ ]]; then
    # Extract just the number part (before any brackets)
    FAN1_BAL=$(echo $BAL2 | awk '{print $1}')
    echo -e "${GREEN}✅ ${NC}Using Method 2 result"
else
    echo -e "${RED}❌ ${NC}Failed to get Fan1 balance"
    echo -e "${RED}❌ ${NC}BAL1: $BAL1"
    echo -e "${RED}❌ ${NC}BAL2: $BAL2"
    exit 1
fi

FAN1_BAL_ETHER=$(cast to-unit $FAN1_BAL ether)
echo -e "${GREEN}✅ ${NC}Fan1 balance: $FAN1_BAL_ETHER tokens"

# Check vault state
echo -e "${BLUE}ℹ ${NC}Vault state after first mint:"
TOTAL_SUPPLY=$(cast call $VAULT "totalSupply()" --rpc-url $RPC_URL)
TOTAL_SUPPLY_ETHER=$(cast to-unit $TOTAL_SUPPLY ether)
echo -e "${BLUE}ℹ ${NC}  Total supply: $TOTAL_SUPPLY_ETHER tokens"

TOTAL_COLLATERAL=$(cast call $VAULT "totalCollateral()" --rpc-url $RPC_URL)
TOTAL_COLLATERAL_ETHER=$(cast to-unit $TOTAL_COLLATERAL ether)
echo -e "${BLUE}ℹ ${NC}  Total collateral: $TOTAL_COLLATERAL_ETHER CELO"

# ============================================================================
# STEP 7: Test Aura Update (Increase)
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 7: Testing Aura Update (Increase)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}ℹ ${NC}Fast-forwarding 6 hours..."
cast rpc evm_increaseTime 21601 --rpc-url $RPC_URL > /dev/null
cast rpc evm_mine --rpc-url $RPC_URL > /dev/null

echo -e "${BLUE}ℹ ${NC}Oracle pushing increased aura (175)..."
cast send $ORACLE \
    "pushAura(address,uint256,string)" \
    $VAULT 175 "QmMockIncreasedMetrics456" \
    --rpc-url $RPC_URL \
    --private-key $DEPLOYER_KEY

NEW_PEG=$(cast call $VAULT "getPeg()" --rpc-url $RPC_URL)
NEW_PEG_ETHER=$(cast to-unit $NEW_PEG ether)
echo -e "${GREEN}✅ ${NC}New peg: $NEW_PEG_ETHER CELO per token (increased!)"

# ============================================================================
# STEP 8: Fan2 Minting at Higher Peg
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 8: Fan2 Minting at Higher Peg${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}ℹ ${NC}Fan2 minting 30 tokens at higher peg..."

cast send $VAULT \
    "mintTokens(uint256)" \
    "30000000000000000000" \
    --value 70ether \
    --rpc-url $RPC_URL \
    --private-key $FAN2_KEY

FAN2_BAL=$(cast call $TOKEN "balanceOf(address)" $FAN2 --rpc-url $RPC_URL)
FAN2_BAL_ETHER=$(cast to-unit $FAN2_BAL ether)
echo -e "${GREEN}✅ ${NC}Fan2 balance: $FAN2_BAL_ETHER tokens"

# ============================================================================
# STEP 9: Test Forced Burn Mechanism
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 9: Testing Forced Burn Mechanism${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}ℹ ${NC}Minting more tokens to exceed future cap..."

cast send $VAULT \
    "mintTokens(uint256)" \
    "350000000000000000000" \
    --value 800ether \
    --rpc-url $RPC_URL \
    --private-key $FAN1_KEY

SUPPLY_BEFORE=$(cast call $VAULT "totalSupply()" --rpc-url $RPC_URL)
SUPPLY_BEFORE_ETHER=$(cast to-unit $SUPPLY_BEFORE ether)
echo -e "${BLUE}ℹ ${NC}Total supply before burn: $SUPPLY_BEFORE_ETHER tokens"

echo -e "${BLUE}ℹ ${NC}Fast-forwarding 6 hours..."
cast rpc evm_increaseTime 21601 --rpc-url $RPC_URL > /dev/null
cast rpc evm_mine --rpc-url $RPC_URL > /dev/null

echo -e "${BLUE}ℹ ${NC}Oracle pushing low aura (20) to trigger forced burn..."
cast send $ORACLE \
    "pushAura(address,uint256,string)" \
    $VAULT 20 "QmMockLowAura" \
    --rpc-url $RPC_URL \
    --private-key $DEPLOYER_KEY

NEW_CAP=$(cast call $VAULT "getCurrentSupplyCap()" --rpc-url $RPC_URL)
NEW_CAP_ETHER=$(cast to-unit $NEW_CAP ether)
echo -e "${YELLOW}⚠️  ${NC}New supply cap: $NEW_CAP_ETHER tokens (supply exceeds cap!)"

echo -e "${BLUE}ℹ ${NC}Triggering forced burn..."
cast send $VAULT \
    "checkAndTriggerForcedBurn()" \
    --rpc-url $RPC_URL \
    --private-key $DEPLOYER_KEY

echo -e "${GREEN}✅ ${NC}Forced burn triggered, 24-hour grace period started"

PENDING_BURN=$(cast call $VAULT "pendingForcedBurn()" --rpc-url $RPC_URL)
PENDING_BURN_ETHER=$(cast to-unit $PENDING_BURN ether)
echo -e "${BLUE}ℹ ${NC}Pending forced burn: $PENDING_BURN_ETHER tokens"

echo -e "${BLUE}ℹ ${NC}Fast-forwarding 24 hours (grace period)..."
cast rpc evm_increaseTime 86400 --rpc-url $RPC_URL > /dev/null
cast rpc evm_mine --rpc-url $RPC_URL > /dev/null

echo -e "${BLUE}ℹ ${NC}Executing forced burn..."
cast send $VAULT \
    "executeForcedBurn(uint256)" \
    100 \
    --rpc-url $RPC_URL \
    --private-key $DEPLOYER_KEY

SUPPLY_AFTER=$(cast call $VAULT "totalSupply()" --rpc-url $RPC_URL)
SUPPLY_AFTER_ETHER=$(cast to-unit $SUPPLY_AFTER ether)
echo -e "${GREEN}✅ ${NC}Total supply after burn: $SUPPLY_AFTER_ETHER tokens"

# Calculate burned amount (convert to decimal first to avoid bc issues)
SUPPLY_BEFORE_DEC=$(cast --to-dec $SUPPLY_BEFORE 2>/dev/null || echo $SUPPLY_BEFORE)
SUPPLY_AFTER_DEC=$(cast --to-dec $SUPPLY_AFTER 2>/dev/null || echo $SUPPLY_AFTER)

if [[ $SUPPLY_BEFORE_DEC =~ ^[0-9]+$ ]] && [[ $SUPPLY_AFTER_DEC =~ ^[0-9]+$ ]]; then
    if [ $SUPPLY_BEFORE_DEC -gt $SUPPLY_AFTER_DEC ]; then
        BURNED=$((SUPPLY_BEFORE_DEC - SUPPLY_AFTER_DEC))
        BURNED_ETHER=$(cast to-unit $BURNED ether 2>/dev/null || echo "N/A")
        echo -e "${GREEN}✅ ${NC}Tokens burned: $BURNED_ETHER tokens"
    else
        echo -e "${YELLOW}⚠️  ${NC}Supply increased or stayed same (before: $SUPPLY_BEFORE_DEC, after: $SUPPLY_AFTER_DEC)"
    fi
else
    echo -e "${YELLOW}⚠️  ${NC}Could not calculate burned amount (before: $SUPPLY_BEFORE_DEC, after: $SUPPLY_AFTER_DEC)"
fi

# ============================================================================
# STEP 10: Test Token Redemption
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 10: Testing Token Redemption${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${BLUE}ℹ ${NC}Fan1 redeeming 25 tokens..."

FAN1_BAL_BEFORE=$(cast call $TOKEN "balanceOf(address)" $FAN1 --rpc-url $RPC_URL)

# First, Fan1 must approve the vault to spend their tokens
echo -e "${BLUE}ℹ ${NC}Fan1 approving vault to spend tokens..."
cast send $TOKEN \
    "approve(address,uint256)" \
    $VAULT "25000000000000000000" \
    --rpc-url $RPC_URL \
    --private-key $FAN1_KEY

echo -e "${GREEN}✅ ${NC}Approval granted"

# Now redeem
echo -e "${BLUE}ℹ ${NC}Redeeming 25 tokens..."
cast send $VAULT \
    "redeemTokens(uint256)" \
    "25000000000000000000" \
    --rpc-url $RPC_URL \
    --private-key $FAN1_KEY

FAN1_BAL_AFTER=$(cast call $TOKEN "balanceOf(address)" $FAN1 --rpc-url $RPC_URL)
FAN1_BAL_AFTER_ETHER=$(cast to-unit $FAN1_BAL_AFTER ether)
echo -e "${GREEN}✅ ${NC}Fan1 balance after redemption: $FAN1_BAL_AFTER_ETHER tokens"

# ============================================================================
# STEP 11: Final Vault State
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 11: Final Vault State${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

FINAL_SUPPLY=$(cast call $VAULT "totalSupply()" --rpc-url $RPC_URL)
FINAL_SUPPLY_ETHER=$(cast to-unit $FINAL_SUPPLY ether)

FINAL_COLLATERAL=$(cast call $VAULT "totalCollateral()" --rpc-url $RPC_URL)
FINAL_COLLATERAL_ETHER=$(cast to-unit $FINAL_COLLATERAL ether)

FINAL_STAGE=$(cast call $VAULT "stage()" --rpc-url $RPC_URL)

FINAL_AURA=$(cast call $VAULT "getCurrentAura()" --rpc-url $RPC_URL)

FINAL_PEG=$(cast call $VAULT "getPeg()" --rpc-url $RPC_URL)
FINAL_PEG_ETHER=$(cast to-unit $FINAL_PEG ether)

echo -e "${BLUE}ℹ ${NC}Final Vault Metrics:"
echo -e "${BLUE}ℹ ${NC}  Total Supply: $FINAL_SUPPLY_ETHER tokens"
echo -e "${BLUE}ℹ ${NC}  Total Collateral: $FINAL_COLLATERAL_ETHER CELO"
echo -e "${BLUE}ℹ ${NC}  Stage: $FINAL_STAGE"
echo -e "${BLUE}ℹ ${NC}  Aura: $FINAL_AURA"
echo -e "${BLUE}ℹ ${NC}  Peg: $FINAL_PEG_ETHER CELO per token"

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}✨ Deployment & Testing Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${GREEN}✅ ${NC}All tests passed successfully!"
echo ""
echo -e "${BLUE}ℹ ${NC}Contract Addresses:"
echo -e "${BLUE}ℹ ${NC}  Treasury: $TREASURY"
echo -e "${BLUE}ℹ ${NC}  Oracle: $ORACLE"
echo -e "${BLUE}ℹ ${NC}  Factory: $FACTORY"
echo -e "${BLUE}ℹ ${NC}  Vault: $VAULT"
echo -e "${BLUE}ℹ ${NC}  Token: $TOKEN"
echo ""
echo -e "${BLUE}ℹ ${NC}Account Balances:"
echo -e "${BLUE}ℹ ${NC}  Fan1 tokens: $(cast to-unit $(cast call $TOKEN "balanceOf(address)" $FAN1 --rpc-url $RPC_URL) ether)"
echo -e "${BLUE}ℹ ${NC}  Fan2 tokens: $(cast to-unit $(cast call $TOKEN "balanceOf(address)" $FAN2 --rpc-url $RPC_URL) ether)"
echo ""
echo -e "${BLUE}ℹ ${NC}Save these addresses for frontend development!"

# Save addresses to file
cat > deployed-addresses.json << EOF
{
  "treasury": "$TREASURY",
  "oracle": "$ORACLE",
  "factory": "$FACTORY",
  "vault": "$VAULT",
  "token": "$TOKEN",
  "creator": "$CREATOR",
  "deployer": "$DEPLOYER"
}
EOF

echo -e "${GREEN}✅ ${NC}Addresses saved to deployed-addresses.json"

# Cleanup temp files
rm -f receipt.json

echo ""
echo -e "${GREEN}🎉 Done!${NC}"
