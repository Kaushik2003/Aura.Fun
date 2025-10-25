/**
 * Error parsing utilities for AuraFi contract interactions
 */

// Contract error mappings for user-friendly messages
const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  // CreatorVault errors
  'InsufficientCollateral': 'Not enough CELO. Please add more collateral.',
  'StageNotUnlocked': 'Vault not bootstrapped. Creator must deposit 100 CELO first.',
  'ExceedsStageCap': 'Stage capacity reached. Wait for creator to unlock next stage.',
  'ExceedsSupplyCap': 'Supply cap reached due to low aura. Wait for aura to increase.',
  'HealthTooLow': 'This action would drop vault health below 150%. Reduce quantity or add more collateral.',
  'NotLiquidatable': 'Vault health is above 120%. Liquidation not needed.',
  'InvalidStage': 'Invalid stage transition. Check stage requirements.',
  'OnlyCreator': 'Only the vault creator can perform this action.',
  'ZeroAmount': 'Amount must be greater than zero.',
  'InsufficientBalance': 'Insufficient token balance for this operation.',
  'InsufficientAllowance': 'Please approve tokens before proceeding.',
  'ForcedBurnActive': 'Forced burn is active. Cannot perform this action.',
  'GracePeriodNotExpired': 'Grace period has not expired yet.',
  'NoForcedBurnPending': 'No forced burn is currently pending.',
  
  // VaultFactory errors
  'InvalidBaseCap': 'Base capacity must be greater than zero.',
  'EmptyName': 'Token name cannot be empty.',
  'EmptySymbol': 'Token symbol cannot be empty.',
  
  // Treasury errors
  'OnlyOwner': 'Only the treasury owner can perform this action.',
  'InsufficientTreasuryBalance': 'Insufficient treasury balance for withdrawal.',
  
  // Oracle errors
  'InvalidAura': 'Aura score must be between 0 and 200.',
  'StaleEvidence': 'Evidence is too old. Please provide recent data.',
  
  // General ERC20 errors
  'ERC20InsufficientBalance': 'Insufficient token balance.',
  'ERC20InsufficientAllowance': 'Token allowance too low. Please approve more tokens.',
  'ERC20InvalidSender': 'Invalid sender address.',
  'ERC20InvalidReceiver': 'Invalid receiver address.',
  
  // Network/RPC errors
  'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
  'TRANSACTION_REJECTED': 'Transaction was rejected by user.',
  'INSUFFICIENT_FUNDS': 'Insufficient funds to pay for gas.',
  'NONCE_TOO_HIGH': 'Transaction nonce is too high. Please reset your wallet.',
  'REPLACEMENT_UNDERPRICED': 'Gas price too low. Please increase gas price.',
  'EXECUTION_REVERTED': 'Transaction failed during execution.',
}

/**
 * Parse contract error and return user-friendly message
 * 
 * @param error - Error object from contract interaction
 * @returns User-friendly error message
 */
export function parseContractError(error: any): string {
  if (!error) {
    return 'An unknown error occurred. Please try again.'
  }

  // Handle string errors
  if (typeof error === 'string') {
    return getErrorMessage(error)
  }

  // Handle error objects with message
  if (error.message) {
    return parseErrorMessage(error.message)
  }

  // Handle error objects with reason
  if (error.reason) {
    return getErrorMessage(error.reason)
  }

  // Handle viem/wagmi specific errors
  if (error.cause?.reason) {
    return getErrorMessage(error.cause.reason)
  }

  // Handle revert errors with data
  if (error.data) {
    const revertReason = extractRevertReason(error.data)
    if (revertReason) {
      return getErrorMessage(revertReason)
    }
  }

  // Handle user rejection
  if (error.code === 4001 || error.message?.includes('User rejected')) {
    return 'Transaction was cancelled by user.'
  }

  // Handle insufficient funds
  if (error.code === -32000 || error.message?.includes('insufficient funds')) {
    return 'Insufficient funds to pay for gas fees.'
  }

  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
    return 'Network connection failed. Please check your internet connection and try again.'
  }

  // Fallback to original error message if available
  if (error.shortMessage) {
    return error.shortMessage
  }

  return 'Transaction failed. Please try again.'
}

/**
 * Parse error message and extract meaningful parts
 */
function parseErrorMessage(message: string): string {
  // Look for revert reason in various formats
  const revertPatterns = [
    /execution reverted: (.+)/i,
    /revert (.+)/i,
    /reverted with reason string '(.+)'/i,
    /VM Exception while processing transaction: revert (.+)/i,
  ]

  for (const pattern of revertPatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      return getErrorMessage(match[1].trim())
    }
  }

  // Check for specific error patterns
  if (message.includes('User rejected')) {
    return 'Transaction was cancelled by user.'
  }

  if (message.includes('insufficient funds')) {
    return 'Insufficient funds to pay for gas fees.'
  }

  if (message.includes('network')) {
    return 'Network connection failed. Please check your internet connection.'
  }

  return getErrorMessage(message)
}

/**
 * Extract revert reason from error data
 */
function extractRevertReason(data: string): string | null {
  try {
    // Remove 0x prefix if present
    const cleanData = data.startsWith('0x') ? data.slice(2) : data

    // Check if it's a revert with reason (starts with 08c379a0)
    if (cleanData.startsWith('08c379a0')) {
      // Decode the reason string
      const reasonHex = cleanData.slice(8) // Remove method selector
      const reasonLength = parseInt(reasonHex.slice(64, 128), 16) * 2 // Get string length
      const reasonData = reasonHex.slice(128, 128 + reasonLength)
      
      // Convert hex to string
      let reason = ''
      for (let i = 0; i < reasonData.length; i += 2) {
        const byte = parseInt(reasonData.slice(i, i + 2), 16)
        if (byte !== 0) {
          reason += String.fromCharCode(byte)
        }
      }
      
      return reason.trim()
    }
  } catch (e) {
    // Ignore parsing errors
  }

  return null
}

/**
 * Get user-friendly error message from error key
 */
function getErrorMessage(errorKey: string): string {
  // Clean up the error key
  const cleanKey = errorKey.trim().replace(/['"]/g, '')

  // Direct lookup
  if (CONTRACT_ERROR_MESSAGES[cleanKey]) {
    return CONTRACT_ERROR_MESSAGES[cleanKey]
  }

  // Partial match lookup
  for (const [key, message] of Object.entries(CONTRACT_ERROR_MESSAGES)) {
    if (cleanKey.includes(key) || key.includes(cleanKey)) {
      return message
    }
  }

  // Return cleaned error if no mapping found
  return cleanKey || 'Transaction failed. Please try again.'
}

/**
 * Check if error indicates user rejection
 */
export function isUserRejection(error: any): boolean {
  if (!error) return false

  const message = error.message || error.reason || ''
  return (
    error.code === 4001 ||
    message.includes('User rejected') ||
    message.includes('user rejected') ||
    message.includes('User denied') ||
    message.includes('cancelled')
  )
}

/**
 * Check if error indicates insufficient funds
 */
export function isInsufficientFunds(error: any): boolean {
  if (!error) return false

  const message = error.message || error.reason || ''
  return (
    error.code === -32000 ||
    message.includes('insufficient funds') ||
    message.includes('InsufficientBalance') ||
    message.includes('exceeds balance')
  )
}

/**
 * Check if error indicates network issues
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false

  const message = error.message || error.reason || ''
  return (
    error.code === 'NETWORK_ERROR' ||
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('fetch')
  )
}

/**
 * Check if error indicates wrong network
 */
export function isWrongNetworkError(error: any): boolean {
  if (!error) return false

  const message = error.message || error.reason || ''
  return (
    message.includes('chain') ||
    message.includes('network') ||
    message.includes('ChainMismatchError') ||
    error.name === 'ChainMismatchError'
  )
}

/**
 * Check if error indicates contract not found
 */
export function isContractNotFoundError(error: any): boolean {
  if (!error) return false

  const message = error.message || error.reason || ''
  return (
    message.includes('contract not deployed') ||
    message.includes('no code at address') ||
    message.includes('CALL_EXCEPTION') ||
    error.code === 'CALL_EXCEPTION'
  )
}

/**
 * Get error severity level
 */
export function getErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
  if (!error) return 'low'

  // Critical errors that prevent app functionality
  if (isContractNotFoundError(error) || isWrongNetworkError(error)) {
    return 'critical'
  }

  // High severity errors that block user actions
  if (isInsufficientFunds(error) || isNetworkError(error)) {
    return 'high'
  }

  // Medium severity errors that are recoverable
  if (isUserRejection(error)) {
    return 'medium'
  }

  // Low severity for other errors
  return 'low'
}

/**
 * Format error for logging/debugging
 */
export function formatErrorForLogging(error: any): {
  message: string
  code?: string | number
  stack?: string
  severity: string
  timestamp: string
} {
  return {
    message: parseContractError(error),
    code: error?.code,
    stack: error?.stack,
    severity: getErrorSeverity(error),
    timestamp: new Date().toISOString(),
  }
}

/**
 * Enhanced error parser with context
 */
export function parseContractErrorWithContext(
  error: any,
  context?: {
    action?: string
    contract?: string
    function?: string
  }
): {
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  isRetryable: boolean
  suggestedAction?: string
} {
  const message = parseContractError(error)
  const severity = getErrorSeverity(error)
  
  let isRetryable = true
  let suggestedAction: string | undefined

  // Determine if error is retryable and suggest actions
  if (isUserRejection(error)) {
    isRetryable = true
    suggestedAction = 'Please try the transaction again and approve it in your wallet.'
  } else if (isInsufficientFunds(error)) {
    isRetryable = false
    suggestedAction = 'Please add more CELO to your wallet or reduce the transaction amount.'
  } else if (isWrongNetworkError(error)) {
    isRetryable = false
    suggestedAction = 'Please switch to the correct network in your wallet.'
  } else if (isNetworkError(error)) {
    isRetryable = true
    suggestedAction = 'Please check your internet connection and try again.'
  } else if (isContractNotFoundError(error)) {
    isRetryable = false
    suggestedAction = 'The contract may not be deployed on this network. Please check the network configuration.'
  }

  // Add context-specific suggestions
  if (context?.action === 'mint' && message.includes('Stage')) {
    suggestedAction = 'The vault needs to be bootstrapped by the creator first.'
  } else if (context?.action === 'redeem' && message.includes('health')) {
    suggestedAction = 'Try reducing the redemption amount to maintain vault health.'
  } else if (context?.action === 'liquidate' && message.includes('not liquidatable')) {
    suggestedAction = 'This vault is healthy and does not need liquidation.'
  }

  return {
    message,
    severity,
    isRetryable,
    suggestedAction,
  }
}