#!/bin/bash

# Simple Test Vault Creation Script
set -e

echo "========================================="
echo "AuraFi - Creating Test Vaults"
echo "========================================="

# Configuration
RPC_URL="http://localhost:8545"
DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CREATOR1_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
CREATOR2_KEY="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
CREATOR3_KEY="0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
FAN1_KEY="0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"

CREATOR1="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
CREATOR2="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
CREATOR3="0x90F79bf6EB2c4f870365E785982E1f101E93b906"

# Step 1: Build and Deploy
echo "Building contracts..."
forge build

echo "Deploying contracts..."
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast --private-key $DEPLOYER_KEY

# Get addresses from deployments.json
FACTORY=$(jq -r '.factory' deployments.json)
ORACLE=$(jq -r '.oracle' deployments.json)

echo "Factory: $FACTORY"
echo "Oracle: $ORACLE"

# Step 2: Create Vaults
echo ""
echo "Creating vaults..."

echo "Creating Vault 1: TechCreator..."
cast send $FACTORY "createVault(string,string,address,uint256)" "TechCreator" "TECH" $CREATOR1 "50000000000000000000" --rpc-url $RPC_URL --private-key $CREATOR1_KEY

echo "Creating Vault 2: ArtistToken..."
cast send $FACTORY "createVault(string,string,address,uint256)" "ArtistToken" "ART" $CREATOR2 "50000000000000000000" --rpc-url $RPC_URL --private-key $CREATOR2_KEY

echo "Creating Vault 3: MusicToken..."
cast send $FACTORY "createVault(string,string,address,uint256)" "MusicToken" "MUSIC" $CREATOR3 "50000000000000000000" --rpc-url $RPC_URL --private-key $CREATOR3_KEY

# Step 3: Get vault addresses using creatorToVault mapping
echo ""
echo "Getting vault addresses..."
VAULT1_RAW=$(cast call $FACTORY "creatorToVault(address)" $CREATOR1 --rpc-url $RPC_URL)
VAULT2_RAW=$(cast call $FACTORY "creatorToVault(address)" $CREATOR2 --rpc-url $RPC_URL)
VAULT3_RAW=$(cast call $FACTORY "creatorToVault(address)" $CREATOR3 --rpc-url $RPC_URL)

# Clean up addresses (remove padding)
VAULT1="0x${VAULT1_RAW:26:40}"
VAULT2="0x${VAULT2_RAW:26:40}"
VAULT3="0x${VAULT3_RAW:26:40}"

echo "Vault 1 (TECH): $VAULT1"
echo "Vault 2 (ART): $VAULT2"
echo "Vault 3 (MUSIC): $VAULT3"

# Step 4: Set aura for vaults
echo ""
echo "Setting aura for vaults..."
cast send $ORACLE "pushAura(address,uint256,string)" $VAULT1 180 "QmTechTest" --rpc-url $RPC_URL --private-key $DEPLOYER_KEY
cast send $ORACLE "pushAura(address,uint256,string)" $VAULT2 120 "QmArtTest" --rpc-url $RPC_URL --private-key $DEPLOYER_KEY
cast send $ORACLE "pushAura(address,uint256,string)" $VAULT3 60 "QmMusicTest" --rpc-url $RPC_URL --private-key $DEPLOYER_KEY

# Verify aura was set
echo ""
echo "Verifying aura values..."
AURA1=$(cast call $ORACLE "getAura(address)" $VAULT1 --rpc-url $RPC_URL)
AURA2=$(cast call $ORACLE "getAura(address)" $VAULT2 --rpc-url $RPC_URL)
AURA3=$(cast call $ORACLE "getAura(address)" $VAULT3 --rpc-url $RPC_URL)
echo "Vault 1 aura: $AURA1 (should be 180)"
echo "Vault 2 aura: $AURA2 (should be 120)"
echo "Vault 3 aura: $AURA3 (should be 60)"

# Wait for oracle cooldown
echo ""
echo "Waiting for oracle cooldown..."
cast rpc evm_increaseTime 21601 --rpc-url $RPC_URL > /dev/null
cast rpc evm_mine --rpc-url $RPC_URL > /dev/null

# Step 5: Bootstrap vaults
echo ""
echo "Bootstrapping vaults..."
echo "Bootstrapping Vault 1..."
cast send $VAULT1 "bootstrapCreatorStake()" --value 0.001ether --rpc-url $RPC_URL --private-key $CREATOR1_KEY

echo "Bootstrapping Vault 2..."
cast send $VAULT2 "bootstrapCreatorStake()" --value 0.001ether --rpc-url $RPC_URL --private-key $CREATOR2_KEY

echo "Bootstrapping Vault 3..."
cast send $VAULT3 "bootstrapCreatorStake()" --value 0.001ether --rpc-url $RPC_URL --private-key $CREATOR3_KEY

# Step 6: Mint some tokens
echo ""
echo "Minting tokens..."
cast send $VAULT1 "mintTokens(uint256)" 5000000000000000000 --value 0.01ether --rpc-url $RPC_URL --private-key $FAN1_KEY
cast send $VAULT2 "mintTokens(uint256)" 3000000000000000000 --value 0.005ether --rpc-url $RPC_URL --private-key $FAN1_KEY

# Step 7: Save vault info
echo ""
echo "Saving vault addresses..."
cat > test-vaults.json << EOF
{
  "vaults": [
    {
      "name": "TechCreator",
      "symbol": "TECH", 
      "address": "$VAULT1",
      "creator": "$CREATOR1",
      "bootstrapped": true
    },
    {
      "name": "ArtistToken",
      "symbol": "ART",
      "address": "$VAULT2", 
      "creator": "$CREATOR2",
      "bootstrapped": true
    },
    {
      "name": "MusicToken",
      "symbol": "MUSIC",
      "address": "$VAULT3",
      "creator": "$CREATOR3", 
      "bootstrapped": true
    }
  ]
}
EOF

echo ""
echo "========================================="
echo "✅ All vaults created and bootstrapped!"
echo "Factory: $FACTORY"
echo "Oracle: $ORACLE"
echo "Vault 1 (TECH): $VAULT1"
echo "Vault 2 (ART): $VAULT2" 
echo "Vault 3 (MUSIC): $VAULT3"
echo "Vault info saved to test-vaults.json"
echo ""
echo "Final verification:"
FINAL_AURA1=$(cast call $ORACLE "getAura(address)" $VAULT1 --rpc-url $RPC_URL)
FINAL_SUPPLY_CAP1=$(cast call $VAULT1 "getCurrentSupplyCap()" --rpc-url $RPC_URL)
echo "Vault 1 final aura: $FINAL_AURA1"
echo "Vault 1 supply cap: $FINAL_SUPPLY_CAP1"
echo "========================================="