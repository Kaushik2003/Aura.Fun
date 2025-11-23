#!/bin/bash

# 3-simulate-minting.sh
# Simulates minting activity (50 txs per vault).
set -e

echo "========================================="
echo "AuraFi - Step 3: Simulate Minting"
echo "========================================="

export PATH=$PATH:$HOME/.foundry/bin

# Configuration
RPC_URL="https://rpc.ankr.com/celo_sepolia"
DEPLOYER_KEY="8a23fd6c76e5624fccc669c96679e548d5685d53732f0af1479c2de6467b8078"
DEPLOYER_ADDR="0xCB1799Aa5A71ccB295dD9f1fD5Fc7D21A89D4E98"

# Rate Limit
DELAY=0.1
function rate_limit() { sleep $DELAY; }

# Read Log
if [ ! -f deployment-log.json ]; then
    echo "Error: deployment-log.json not found."
    exit 1
fi

# Keys
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

# Load Vaults
VAULT_COUNT=$(jq '.vaults | length' deployment-log.json)
echo "Found $VAULT_COUNT vaults."

# Simulation Config
TXS_PER_VAULT=50
TOTAL_LOOPS=50 # We will do 1 tx per vault per loop
MINT_VALUE="0.01ether" # 0.01 CELO
MINT_AMOUNT="1000000000000000" # 0.001 Tokens (small amount to avoid hitting cap too fast, though cap is 50)
# Actually, if we mint 0.001 tokens 50 times, that's 0.05 tokens. Nowhere near 50.
# User said "doesn't matter if it hits 50 tokens or not".
# But we should try to mint something reasonable.
# Let's mint 0.1 tokens. 50 * 0.1 = 5 tokens. Safe.

MINT_AMOUNT="100000000000000000" # 0.1 Tokens

echo "Starting simulation: $TOTAL_LOOPS loops (Total $((TOTAL_LOOPS * VAULT_COUNT)) txs)..."

for (( loop=1; loop<=TOTAL_LOOPS; loop++ )); do
    echo "--- Loop $loop/$TOTAL_LOOPS ---"
    
    for (( v=0; v<VAULT_COUNT; v++ )); do
        VAULT_ADDR=$(jq -r ".vaults[$v].address" deployment-log.json)
        VAULT_NAME=$(jq -r ".vaults[$v].name" deployment-log.json)
        
        # Pick Random Fan (0-9)
        FAN_IDX=$((RANDOM % 10))
        FAN_KEY="${KEYS[$FAN_IDX]}"
        
        # Try to avoid self-minting for variety, but not strictly forbidden
        CREATOR_ADDR=$(jq -r ".vaults[$v].creator" deployment-log.json)
        FAN_ADDR=$(jq -r ".accounts[$FAN_IDX]" deployment-log.json)
        
        if [ "$FAN_ADDR" == "$CREATOR_ADDR" ]; then
            # Shift by 1
            FAN_IDX=$(( (FAN_IDX + 1) % 10 ))
            FAN_KEY="${KEYS[$FAN_IDX]}"
        fi
        
        echo "  Minting $MINT_AMOUNT ($VAULT_NAME) by Account $FAN_IDX..."
        
        # Execute Mint
        # We use || true to continue on failure
        cast send $VAULT_ADDR "mintTokens(uint256)" "$MINT_AMOUNT" --value $MINT_VALUE --rpc-url $RPC_URL --private-key $FAN_KEY --legacy > /dev/null || echo "    FAILED"
        rate_limit
    done
done

echo ""
echo "✅ Step 3 Complete. Simulation finished."
