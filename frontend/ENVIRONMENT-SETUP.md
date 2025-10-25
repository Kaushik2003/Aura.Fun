# Environment Configuration Guide

This document explains how to configure the AuraFi frontend for different networks (Anvil local development and Sepolia testnet).

## Overview

The frontend uses environment-based configuration to support both local development with Anvil and production deployment on Sepolia testnet. The configuration is automatically validated at runtime.

## Environment Files

### `.env.local` - Anvil Local Development
Used for local development with Foundry's Anvil network.

```bash
NEXT_PUBLIC_NETWORK=anvil
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_CHAIN_NAME="Anvil Local"

# Contract addresses (updated after deployment)
NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_AURA_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_TREASURY_ADDRESS=0x...
```

### `.env.production` - Sepolia Testnet
Used for production deployment on Sepolia testnet.

```bash
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CHAIN_NAME="Sepolia Testnet"

# Contract addresses (updated after deployment)
NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_AURA_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_TREASURY_ADDRESS=0x...
```

## Setup Instructions

### 1. Local Development (Anvil)

1. **Deploy contracts locally:**
   ```bash
   # From project root
   ./deploy-and-test.sh
   ```

2. **Update contract addresses:**
   After deployment, update `.env.local` with the deployed contract addresses from the deployment output.

3. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

### 2. Sepolia Testnet

1. **Configure RPC URL:**
   Update `NEXT_PUBLIC_RPC_URL` in `.env.production` with your Infura/Alchemy project ID.

2. **Deploy contracts to Sepolia:**
   ```bash
   # Deploy using Foundry (configure your private key and RPC)
   forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast
   ```

3. **Update contract addresses:**
   Update `.env.production` with the deployed Sepolia contract addresses.

4. **Build and deploy:**
   ```bash
   cd frontend
   npm run build
   # Deploy to your hosting platform (Vercel, Netlify, etc.)
   ```

## Configuration Validation

Run the validation script to check your environment configuration:

```bash
cd frontend
node scripts/validate-config.js
```

This will verify:
- All required environment variables are present
- Network configuration is correct
- Contract addresses are valid (warns about placeholders)

## Usage in Code

### Getting Contract Addresses
```typescript
import { getContractAddress } from '@/lib/config'

const vaultFactoryAddress = getContractAddress('vaultFactory')
const oracleAddress = getContractAddress('auraOracle')
const treasuryAddress = getContractAddress('treasury')
```

### Network Detection
```typescript
import { useNetworkConfig } from '@/hooks/use-network-config'

function MyComponent() {
  const { targetChain, isWrongNetwork } = useNetworkConfig()
  
  if (isWrongNetwork) {
    return <div>Please switch to {targetChain.name}</div>
  }
  
  // Component content...
}
```

### Configuration Access
```typescript
import { getConfig } from '@/lib/config'

const config = getConfig()
console.log('Current network:', config.network)
console.log('Chain ID:', config.chainId)
console.log('RPC URL:', config.rpcUrl)
```

## Error Handling

The configuration system includes comprehensive error handling:

- **Missing variables**: Clear error messages about which variables are missing
- **Invalid addresses**: Validation of Ethereum address format
- **Placeholder addresses**: Runtime detection of unconfigured addresses
- **Network mismatch**: Automatic detection when user is on wrong network

## Troubleshooting

### "Contract addresses not configured" Error
This means you have placeholder addresses (0x000...) in your environment file. Deploy the contracts first and update the addresses.

### "Invalid or missing environment variables" Error
Check that all required variables are present in your `.env.local` or `.env.production` file. Run the validation script for details.

### Wrong Network Warning
The frontend will show a warning banner if you're connected to the wrong network. Click "Switch Network" to automatically switch to the correct network.

## Security Notes

- Never commit private keys or sensitive RPC URLs to version control
- Use environment variables for sensitive configuration
- The `.env.local` and `.env.production` files are already in `.gitignore`
- For production, use secure RPC providers (Infura, Alchemy, etc.)