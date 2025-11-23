#!/bin/bash

# 4-simulate-single-vault.sh
# Simulates 500 transactions on the first vault using 10 test accounts.
set -e

echo "========================================="
echo "AuraFi - Step 4: Single Vault Simulation"
echo "========================================="

export PATH=$PATH:$HOME/.foundry/bin

# Configuration
RPC_URL="https://rpc.celocolombia.org"  # This is mainet not testnet
DEPLOYER_KEY="8a23fd6c76e5624fccc669c96679e548d5685d53732f0af1479c2de6467b8078"
DEPLOYER_ADDR="0xCB1799Aa5A71ccB295dD9f1fD5Fc7D21A89D4E98"


# Rate Limit (Optimized for local)
DELAY=0.1
function rate_limit() { sleep $DELAY; }

# Read Log
if [ ! -f deployment-log.json ]; then
    echo "Error: deployment-log.json not found."
    exit 1
fi

# Keys (10 Test Accounts)
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

# Get First Vault
VAULT_ADDR=$(jq -r '.vaults[0].address' deployment-log.json)
VAULT_NAME=$(jq -r '.vaults[0].name' deployment-log.json)

if [ -z "$VAULT_ADDR" ] || [ "$VAULT_ADDR" == "null" ]; then
    echo "Error: No vaults found in deployment-log.json"
    exit 1
fi

echo "Target Vault: $VAULT_NAME ($VAULT_ADDR)"
echo "Simulating 500 transactions..."

TOTAL_TXS=500
MINT_VALUE="0.01ether" # 0.01 CELO per tx

for (( i=1; i<=TOTAL_TXS; i++ )); do
    # Pick Random Account (0-9)
    IDX=$((RANDOM % 10))
    KEY="${KEYS[$IDX]}"
    
    # Random Mint Amount: 0.001 to 0.005 tokens (1e15 to 5e15)
    # This ensures 500 txs * 0.005 = 2.5 tokens max, well under 50 cap.
    # We'll just use a few fixed small amounts for simplicity
    AMOUNTS=("1000000000000000" "2000000000000000" "3000000000000000" "4000000000000000" "5000000000000000")
    AMT_IDX=$((RANDOM % 5))
    AMOUNT="${AMOUNTS[$AMT_IDX]}"
    
    echo "[$i/$TOTAL_TXS] Account $IDX minting $AMOUNT wei..."
    
    # Execute Mint
    # || true to continue if fail
    cast send $VAULT_ADDR "mintTokens(uint256)" "$AMOUNT" --value $MINT_VALUE --rpc-url $RPC_URL --private-key $KEY --legacy > /dev/null 2>&1 || echo "  FAILED"
    
    rate_limit
done

echo ""
echo "✅ Step 4 Complete. 500 transactions simulated on $VAULT_NAME."
