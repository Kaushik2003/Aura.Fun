import { z } from 'zod'

// Environment validation schema
const envSchema = z.object({
  NEXT_PUBLIC_NETWORK: z.enum(['anvil', 'sepolia', 'celo_sepolia']),
  NEXT_PUBLIC_RPC_URL: z.string().url(),
  NEXT_PUBLIC_VAULT_FACTORY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  NEXT_PUBLIC_AURA_ORACLE_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  NEXT_PUBLIC_TREASURY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  NEXT_PUBLIC_CHAIN_ID: z.string().transform(Number),
  NEXT_PUBLIC_CHAIN_NAME: z.string(),
})

// Network configuration type
export type NetworkConfig = {
  network: 'anvil' | 'sepolia' | 'celo_sepolia'
  chainId: number
  chainName: string
  rpcUrl: string
  contracts: {
    vaultFactory: `0x${string}`
    auraOracle: `0x${string}`
    treasury: `0x${string}`
  }
}

// Validate and parse environment variables
function validateEnv() {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK,
      NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
      NEXT_PUBLIC_VAULT_FACTORY_ADDRESS: process.env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS,
      NEXT_PUBLIC_AURA_ORACLE_ADDRESS: process.env.NEXT_PUBLIC_AURA_ORACLE_ADDRESS,
      NEXT_PUBLIC_TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
      NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
      NEXT_PUBLIC_CHAIN_NAME: process.env.NEXT_PUBLIC_CHAIN_NAME,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(e => e.path.join('.')).join(', ')
      throw new Error(`Invalid or missing environment variables: ${missingVars}`)
    }
    throw error
  }
}

// Get validated configuration
export function getConfig(): NetworkConfig {
  const env = validateEnv()

  // Check for placeholder addresses
  const placeholderAddress = '0x0000000000000000000000000000000000000000'
  if (
    env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS === placeholderAddress ||
    env.NEXT_PUBLIC_AURA_ORACLE_ADDRESS === placeholderAddress ||
    env.NEXT_PUBLIC_TREASURY_ADDRESS === placeholderAddress
  ) {
    throw new Error(`Contract addresses not configured for ${env.NEXT_PUBLIC_NETWORK} network`)
  }

  return {
    network: env.NEXT_PUBLIC_NETWORK,
    chainId: env.NEXT_PUBLIC_CHAIN_ID,
    chainName: env.NEXT_PUBLIC_CHAIN_NAME,
    rpcUrl: env.NEXT_PUBLIC_RPC_URL,
    contracts: {
      vaultFactory: env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS as `0x${string}`,
      auraOracle: env.NEXT_PUBLIC_AURA_ORACLE_ADDRESS as `0x${string}`,
      treasury: env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`,
    },
  }
}

// Helper function to get contract address by name
export function getContractAddress(contractName: keyof NetworkConfig['contracts']): `0x${string}` {
  const config = getConfig()
  return config.contracts[contractName]
}

// Network-specific configurations
export const NETWORK_CONFIGS = {
  anvil: {
    chainId: 31337,
    name: 'Anvil Local',
    rpcUrls: {
      default: { http: ['http://localhost:8545'] },
      public: { http: ['http://localhost:8545'] },
    },
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrls: {
      default: { http: ['https://sepolia.infura.io/v3'] },
      public: { http: ['https://sepolia.infura.io/v3'] },
    },
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18,
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
    },
  },
  celo_sepolia: {
    chainId: 11142220,
    name: 'Celo Sepolia',
    rpcUrls: {
      default: { http: ['https://rpc.ankr.com/celo_sepolia'] },
      public: { http: ['https://rpc.ankr.com/celo_sepolia'] },
    },
    nativeCurrency: {
      name: 'Celo',
      symbol: 'CELO',
      decimals: 18,
    },
    blockExplorers: {
      default: { name: 'CeloScan', url: 'https://sepolia.celoscan.io' },
    },
  },
} as const