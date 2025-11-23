#!/bin/bash

# 1-deploy-and-fund.sh
# Deploys contracts and funds 10 test accounts.
set -e

echo "========================================="
echo "AuraFi - Step 1: Deploy & Fund"
echo "========================================="

# Configuration

RPC_URL="https://rpc.celocolombia.org"  # This is mainet not testnet
DEPLOYER_KEY="8a23fd6c76e5624fccc669c96679e548d5685d53732f0af1479c2de6467b8078"
DEPLOYER_ADDR="0xCB1799Aa5A71ccB295dD9f1fD5Fc7D21A89D4E98"

# Rate Limit (2s delay)
DELAY=2
function rate_limit() { sleep $DELAY; }

# Test Accounts (10)
declare -a ACCOUNTS=(
  "0x6Ad6359c38d3ffF76e4486AD006e16311A44A53D"
  "0x442d76deFED76e1d152C47B5711CD959e518Fb98"
  "0x945434c6Af1B2BD46f8fA2A4118625530eD0449F"
  "0xE46E603B56AF485Dd71A9AADE917A90B55dd634D"
  "0x2A335C82891cbE8268d2eb72F712b0A03B62F77E"
  "0x213ad2184d9c25aA7F24A11a369A78601dF3522E"
  "0x291584580FF81502a34Dd5fE2716BC72c62d0246"
  "0x5190C19AC656e0925fA33C303128DcE235f345CB"
  "0xBe73e4d8Caf1B3D2CC770bFc16E9Fd5D3cbA7B12"
  "0xA2Cbb75d9C0C5b1Ddf6811c78CfaAf33d0E14618"
)

# Step 1: Deploy Contracts
echo "[1/2] Deploying contracts..."
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast --private-key $DEPLOYER_KEY --legacy
rate_limit

FACTORY=$(jq -r '.factory' deployments.json)
ORACLE=$(jq -r '.oracle' deployments.json)

if [ -z "$FACTORY" ] || [ "$FACTORY" == "null" ]; then
    echo "Error: Factory address not found in deployments.json"
    exit 1
fi

echo "Factory: $FACTORY"
echo "Oracle: $ORACLE"

# Step 2: Fund Accounts
echo ""
echo "[2/2] Funding test accounts..."
# Budget: 10 CELO total.
# Deployer needs ~2 CELO for gas.
# 8 CELO / 10 accounts = 0.8 CELO each.
FUND_AMOUNT="0.8ether"

for i in "${!ACCOUNTS[@]}"; do
    ADDR="${ACCOUNTS[$i]}"
    echo "Funding Account $((i+1)): $ADDR with $FUND_AMOUNT"
    cast send $ADDR --value $FUND_AMOUNT --rpc-url $RPC_URL --private-key $DEPLOYER_KEY --legacy
    rate_limit
done

# Initialize Log
cat > deployment-log.json << EOF
{
  "network": "Celo Sepolia",
  "factory": "$FACTORY",
  "oracle": "$ORACLE",
  "deployer": "$DEPLOYER_ADDR",
  "accounts": [
EOF

# Add accounts to log
for i in "${!ACCOUNTS[@]}"; do
    COMMA=","
    if [ $i -eq 9 ]; then COMMA=""; fi
    echo "    \"${ACCOUNTS[$i]}\"$COMMA" >> deployment-log.json
done

cat >> deployment-log.json << EOF
  ],
  "vaults": []
}
EOF

echo ""
echo "✅ Step 1 Complete. Log initialized in deployment-log.json"
