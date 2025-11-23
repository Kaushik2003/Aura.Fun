#!/bin/bash

# 2-create-vaults.sh
# Creates vaults and bootstraps them.
set -e

echo "========================================="
echo "AuraFi - Step 2: Create Vaults"
echo "========================================="

# Configuration
RPC_URL="https://rpc.celocolombia.org"  # This is mainet not testnet
DEPLOYER_KEY="8a23fd6c76e5624fccc669c96679e548d5685d53732f0af1479c2de6467b8078"
DEPLOYER_ADDR="0xCB1799Aa5A71ccB295dD9f1fD5Fc7D21A89D4E98"

# Rate Limit
DELAY=2
function rate_limit() { sleep $DELAY; }

# Read Log
if [ ! -f deployment-log.json ]; then
    echo "Error: deployment-log.json not found. Run step 1 first."
    exit 1
fi

FACTORY=$(jq -r '.factory' deployment-log.json)
ORACLE=$(jq -r '.oracle' deployment-log.json)

# Account Keys (Hardcoded for simplicity as they are constant test keys)
declare -a KEYS=(
  "0x2e4774ae87417be23a88b378491471bfe4e79ad35e9431f7f684be36def2b86b"
  "0x42cd0f8e72a29af4bd33ba12ee9b7b315fc5ce14a73c882e871cf09394e97371"
  "0x5bd32f2eb753860f04e9a8aebb96ca4407b4d2ff8035082ff29c545bb3637469"
  "0x140e3fe82f3bed0b92e41adf0b62e0cbd3f0d72d2d251043c0b0541d33b91f51"
  "0x9d059ead4689d155eb0e88d0f8433d273c20e4309ba9fd9270a33ff108c8b582"
  "0x8e6739461776e3eee51478d0252b057ffc483e8b2a0086e107df2fd1fe306f1f"
  "0xc53ab022d4e4576a6b190f168559f6e3d3705039c04372b2aa4d6a334f856c18"
  "0x6824d80f6307018c9417ee61f873ba51ce8351f5898ae8947cdad96917fcbe08"
  "0xa5832f9662429f18e1a4976c781e6a7c94e8a62d2284eda0797ed33a2b603a9c"
  "0xbd892c38b494842d6b5cd3cf87fbe7fec2b94e6a0e101fbca7fe894c14f19cb7"
)

# Trendy Names
declare -a NAMES=("Pepe" "Doge" "Shiba" "Bonk" "Wif" "Floki" "Popcat" "Brett" "Mog" "Turbo")
declare -a SYMBOLS=("PEPE" "DOGE" "SHIB" "BONK" "WIF" "FLOKI" "POP" "BRETT" "MOG" "TURBO")

# Temp file for JSON updates
TMP_JSON=$(mktemp)
cp deployment-log.json $TMP_JSON

# Loop
for i in "${!KEYS[@]}"; do
    KEY="${KEYS[$i]}"
    NAME="${NAMES[$i]}"
    SYMBOL="${SYMBOLS[$i]}"
    # Get address from log (jq)
    CREATOR=$(jq -r ".accounts[$i]" deployment-log.json)
    
    echo "[$((i+1))/10] Processing $NAME ($CREATOR)..."
    
    # 1. Create Vault
    echo "  Creating Vault..."
    cast send $FACTORY "createVault(string,string,address,uint256)" "$NAME" "$SYMBOL" "$CREATOR" "50000000000000000000" --rpc-url $RPC_URL --private-key $KEY --legacy > /dev/null
    rate_limit
    
    # Get Vault Address
    VAULT_RAW=$(cast call $FACTORY "creatorToVault(address)" $CREATOR --rpc-url $RPC_URL)
    VAULT="0x${VAULT_RAW:26:40}"
    echo "  Vault: $VAULT"
    rate_limit

    # 2. Set Aura (Deployer)
    SCORE=$((50 + i * 15))
    echo "  Setting Aura to $SCORE..."
    cast send $ORACLE "pushAura(address,uint256,string)" $VAULT $SCORE "QmInit${i}" --rpc-url $RPC_URL --private-key $DEPLOYER_KEY --legacy > /dev/null
    rate_limit

    # 3. Bootstrap
    echo "  Bootstrapping..."
    cast send $VAULT "bootstrapCreatorStake()" --value 0.001ether --rpc-url $RPC_URL --private-key $KEY --legacy > /dev/null
    rate_limit
    
    # Update JSON
    # We use jq to append to the vaults array
    jq --arg name "$NAME" --arg symbol "$SYMBOL" --arg addr "$VAULT" --arg creator "$CREATOR" \
       '.vaults += [{"name": $name, "symbol": $symbol, "address": $addr, "creator": $creator}]' \
       $TMP_JSON > "${TMP_JSON}.tmp" && mv "${TMP_JSON}.tmp" $TMP_JSON
done

mv $TMP_JSON deployment-log.json
echo ""
echo "✅ Step 2 Complete. Vaults created and logged."
