/**
 * @file Contract ABIs for Aura.farm Protocol
 * @description Contains ABI definitions for all smart contracts in the Aura.farm protocol
 */

export const VAULT_ABI = [
  // Constructor
  {
    type: 'constructor',
    inputs: [
      { name: '_creator', type: 'address', internalType: 'address' },
      { name: '_token', type: 'address', internalType: 'address' },
      { name: '_oracle', type: 'address', internalType: 'address' },
      { name: '_treasury', type: 'address', internalType: 'address' },
      { name: '_baseCap', type: 'uint256', internalType: 'uint256' },
      { name: 'initialOwner', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'nonpayable'
  },

  // State Variables (View Functions)
  {
    type: 'function',
    name: 'creator',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'token',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'oracle',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'treasury',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'creatorCollateral',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'fanCollateral',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalCollateral',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'stage',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'baseCap',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'pendingForcedBurn',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'forcedBurnDeadline',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },

  // Core Functions
  {
    type: 'function',
    name: 'bootstrapCreatorStake',
    inputs: [],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'unlockStage',
    inputs: [],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'mintTokens',
    inputs: [{ name: 'qty', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'redeemTokens',
    inputs: [{ name: 'qty', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'liquidate',
    inputs: [],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'checkAndTriggerForcedBurn',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'executeForcedBurn',
    inputs: [{ name: 'maxOwnersToProcess', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // View Functions
  {
    type: 'function',
    name: 'getCurrentAura',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPeg',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getCurrentSupplyCap',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getVaultState',
    inputs: [],
    outputs: [
      { name: '_creatorCollateral', type: 'uint256', internalType: 'uint256' },
      { name: '_fanCollateral', type: 'uint256', internalType: 'uint256' },
      { name: '_totalCollateral', type: 'uint256', internalType: 'uint256' },
      { name: '_totalSupply', type: 'uint256', internalType: 'uint256' },
      { name: '_peg', type: 'uint256', internalType: 'uint256' },
      { name: '_stage', type: 'uint8', internalType: 'uint8' },
      { name: 'health', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPosition',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'index', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct CreatorVault.Position',
        components: [
          { name: 'owner', type: 'address', internalType: 'address' },
          { name: 'qty', type: 'uint256', internalType: 'uint256' },
          { name: 'collateral', type: 'uint256', internalType: 'uint256' },
          { name: 'stage', type: 'uint8', internalType: 'uint8' },
          { name: 'createdAt', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPositionCount',
    inputs: [{ name: 'owner', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },

  // Admin Functions
  {
    type: 'function',
    name: 'setToken',
    inputs: [{ name: '_token', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setStageConfig',
    inputs: [
      { name: '_stage', type: 'uint8', internalType: 'uint8' },
      { name: '_stakeRequired', type: 'uint256', internalType: 'uint256' },
      { name: '_mintCap', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // Events
  {
    type: 'event',
    name: 'StageUnlocked',
    inputs: [
      { name: 'vault', type: 'address', indexed: true, internalType: 'address' },
      { name: 'stage', type: 'uint8', indexed: false, internalType: 'uint8' },
      { name: 'stakeAmount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Minted',
    inputs: [
      { name: 'vault', type: 'address', indexed: true, internalType: 'address' },
      { name: 'minter', type: 'address', indexed: true, internalType: 'address' },
      { name: 'qty', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'collateral', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'stage', type: 'uint8', indexed: false, internalType: 'uint8' },
      { name: 'peg', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Redeemed',
    inputs: [
      { name: 'vault', type: 'address', indexed: true, internalType: 'address' },
      { name: 'redeemer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'qty', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'collateralReturned', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SupplyCapShrink',
    inputs: [
      { name: 'vault', type: 'address', indexed: true, internalType: 'address' },
      { name: 'oldCap', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newCap', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'pendingBurn', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'graceEndTs', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ForcedBurnExecuted',
    inputs: [
      { name: 'vault', type: 'address', indexed: true, internalType: 'address' },
      { name: 'tokensBurned', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'collateralWrittenDown', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'LiquidationExecuted',
    inputs: [
      { name: 'vault', type: 'address', indexed: true, internalType: 'address' },
      { name: 'liquidator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'payCELO', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'tokensRemoved', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'bounty', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },

  // Custom Errors
  {
    type: 'error',
    name: 'InsufficientCollateral',
    inputs: []
  },
  {
    type: 'error',
    name: 'StageNotUnlocked',
    inputs: []
  },
  {
    type: 'error',
    name: 'ExceedsStageCap',
    inputs: []
  },
  {
    type: 'error',
    name: 'ExceedsSupplyCap',
    inputs: []
  },
  {
    type: 'error',
    name: 'HealthTooLow',
    inputs: []
  },
  {
    type: 'error',
    name: 'NotLiquidatable',
    inputs: []
  },
  {
    type: 'error',
    name: 'GracePeriodActive',
    inputs: []
  },
  {
    type: 'error',
    name: 'Unauthorized',
    inputs: []
  },
  {
    type: 'error',
    name: 'InsufficientPayment',
    inputs: []
  },
  {
    type: 'error',
    name: 'InsufficientLiquidation',
    inputs: []
  }
] as const

export const FACTORY_ABI = [
  // Constructor
  {
    type: 'constructor',
    inputs: [
      { name: 'initialOwner', type: 'address', internalType: 'address' },
      { name: '_treasury', type: 'address', internalType: 'address' },
      { name: '_oracle', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'nonpayable'
  },

  // State Variables
  {
    type: 'function',
    name: 'treasury',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'oracle',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'creatorToVault',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },

  // Functions
  {
    type: 'function',
    name: 'createVault',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'symbol', type: 'string', internalType: 'string' },
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'baseCap', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'vault', type: 'address', internalType: 'address' },
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setStageConfig',
    inputs: [
      { name: 'vault', type: 'address', internalType: 'address' },
      { name: 'stage', type: 'uint8', internalType: 'uint8' },
      { name: 'stakeRequired', type: 'uint256', internalType: 'uint256' },
      { name: 'mintCap', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // Events
  {
    type: 'event',
    name: 'VaultCreated',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'vault', type: 'address', indexed: false, internalType: 'address' },
      { name: 'token', type: 'address', indexed: false, internalType: 'address' },
      { name: 'baseCap', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'StageConfigured',
    inputs: [
      { name: 'vault', type: 'address', indexed: true, internalType: 'address' },
      { name: 'stage', type: 'uint8', indexed: false, internalType: 'uint8' },
      { name: 'stakeRequired', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'mintCap', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },

  // Custom Errors
  {
    type: 'error',
    name: 'VaultAlreadyExists',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidParameters',
    inputs: []
  }
] as const

export const ORACLE_ABI = [
  // Constructor
  {
    type: 'constructor',
    inputs: [
      { name: 'initialOwner', type: 'address', internalType: 'address' },
      { name: '_oracleAddress', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'nonpayable'
  },

  // State Variables
  {
    type: 'function',
    name: 'oracleAddress',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'ORACLE_UPDATE_COOLDOWN',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },

  // Functions
  {
    type: 'function',
    name: 'pushAura',
    inputs: [
      { name: 'vault', type: 'address', internalType: 'address' },
      { name: 'aura', type: 'uint256', internalType: 'uint256' },
      { name: 'ipfsHash', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getAura',
    inputs: [{ name: 'vault', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getIpfsHash',
    inputs: [{ name: 'vault', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getLastUpdateTimestamp',
    inputs: [{ name: 'vault', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'setOracleAddress',
    inputs: [{ name: 'newOracle', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // Events
  {
    type: 'event',
    name: 'AuraUpdated',
    inputs: [
      { name: 'vault', type: 'address', indexed: true, internalType: 'address' },
      { name: 'aura', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'ipfsHash', type: 'string', indexed: false, internalType: 'string' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'OracleAddressUpdated',
    inputs: [
      { name: 'oldOracle', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOracle', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },

  // Custom Errors
  {
    type: 'error',
    name: 'Unauthorized',
    inputs: []
  },
  {
    type: 'error',
    name: 'CooldownNotElapsed',
    inputs: []
  }
] as const

export const TOKEN_ABI = [
  // Constructor
  {
    type: 'constructor',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'symbol', type: 'string', internalType: 'string' },
      { name: '_vault', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'nonpayable'
  },

  // ERC20 Standard Functions
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'spender', type: 'address', internalType: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address', internalType: 'address' },
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable'
  },

  // Custom Functions
  {
    type: 'function',
    name: 'vault',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'burn',
    inputs: [
      { name: 'from', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  // ERC20 Events
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true, internalType: 'address' },
      { name: 'to', type: 'address', indexed: true, internalType: 'address' },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'spender', type: 'address', indexed: true, internalType: 'address' },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },

  // Custom Errors
  {
    type: 'error',
    name: 'Unauthorized',
    inputs: []
  }
] as const

export const TREASURY_ABI = [
  // Constructor
  {
    type: 'constructor',
    inputs: [{ name: 'initialOwner', type: 'address', internalType: 'address' }],
    stateMutability: 'nonpayable'
  },

  // Functions
  {
    type: 'function',
    name: 'collectFee',
    inputs: [],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getBalance',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },

  // Receive function
  {
    type: 'receive',
    stateMutability: 'payable'
  },

  // Events
  {
    type: 'event',
    name: 'TreasuryCollected',
    inputs: [
      { name: 'vault', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Withdrawn',
    inputs: [
      { name: 'to', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },

  // Custom Errors
  {
    type: 'error',
    name: 'InsufficientBalance',
    inputs: []
  },
  {
    type: 'error',
    name: 'TransferFailed',
    inputs: []
  }
] as const