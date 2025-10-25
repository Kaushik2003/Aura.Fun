/**
 * Toast notification configuration and wrapper functions
 */

import { toast } from 'sonner'
import { 
  parseContractError, 
  parseContractErrorWithContext,
  isUserRejection,
  getErrorSeverity,
  formatErrorForLogging
} from './error-parser'

// Toast configuration options
const TOAST_OPTIONS = {
  duration: 5000, // 5 seconds
  position: 'top-right' as const,
}

const SUCCESS_OPTIONS = {
  ...TOAST_OPTIONS,
  duration: 4000, // Shorter for success messages
}

const ERROR_OPTIONS = {
  ...TOAST_OPTIONS,
  duration: 6000, // Longer for error messages
}

const LOADING_OPTIONS = {
  duration: Infinity, // Loading toasts persist until dismissed
}

/**
 * Show success toast notification
 */
export function showSuccessToast(message: string, description?: string) {
  return toast.success(message, {
    ...SUCCESS_OPTIONS,
    description,
  })
}

/**
 * Show error toast notification with contract error parsing
 */
export function showErrorToast(error: any, fallbackMessage?: string, context?: {
  action?: string
  contract?: string
  function?: string
}) {
  // Don't show toast for user rejections (they know they cancelled)
  if (isUserRejection(error)) {
    return
  }

  // Log error for debugging
  console.error('Error occurred:', formatErrorForLogging(error))

  const errorInfo = parseContractErrorWithContext(error, context)
  const message = errorInfo.message || fallbackMessage || 'An error occurred'
  
  // Adjust toast duration based on severity
  const duration = errorInfo.severity === 'critical' ? 10000 : ERROR_OPTIONS.duration
  
  return toast.error('Transaction Failed', {
    ...ERROR_OPTIONS,
    duration,
    description: message,
    action: errorInfo.suggestedAction ? {
      label: 'Help',
      onClick: () => {
        toast.info('Suggestion', {
          description: errorInfo.suggestedAction,
          duration: 8000,
        })
      }
    } : undefined,
  })
}

/**
 * Show info toast notification
 */
export function showInfoToast(message: string, description?: string) {
  return toast.info(message, {
    ...TOAST_OPTIONS,
    description,
  })
}

/**
 * Show warning toast notification
 */
export function showWarningToast(message: string, description?: string) {
  return toast.warning(message, {
    ...TOAST_OPTIONS,
    description,
  })
}

/**
 * Show loading toast notification
 */
export function showLoadingToast(message: string, description?: string) {
  return toast.loading(message, {
    ...LOADING_OPTIONS,
    description,
  })
}

/**
 * Dismiss a specific toast by ID
 */
export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId)
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  toast.dismiss()
}

/**
 * Transaction-specific toast helpers
 */

/**
 * Show transaction pending toast
 */
export function showTransactionPending(action: string, hash?: string) {
  const message = `${action} Transaction Pending`
  const description = hash 
    ? `Transaction submitted: ${hash.slice(0, 10)}...`
    : 'Please wait for confirmation...'
    
  return showLoadingToast(message, description)
}

/**
 * Show transaction success toast
 */
export function showTransactionSuccess(action: string, hash?: string) {
  const message = `${action} Successful`
  const description = hash 
    ? `Transaction confirmed: ${hash.slice(0, 10)}...`
    : 'Transaction has been confirmed'
    
  return showSuccessToast(message, description)
}

/**
 * Show transaction error toast
 */
export function showTransactionError(action: string, error: any, context?: {
  contract?: string
  function?: string
}) {
  // Don't show toast for user rejections
  if (isUserRejection(error)) {
    return
  }

  const message = `${action} Failed`
  const errorInfo = parseContractErrorWithContext(error, { action, ...context })
  
  // Adjust toast duration based on severity
  const duration = errorInfo.severity === 'critical' ? 10000 : ERROR_OPTIONS.duration
  
  return toast.error(message, {
    ...ERROR_OPTIONS,
    duration,
    description: errorInfo.message,
    action: errorInfo.suggestedAction ? {
      label: 'Help',
      onClick: () => {
        toast.info('Suggestion', {
          description: errorInfo.suggestedAction,
          duration: 8000,
        })
      }
    } : undefined,
  })
}

/**
 * Vault-specific toast helpers
 */

/**
 * Show vault creation success
 */
export function showVaultCreated(vaultAddress: string, tokenAddress: string) {
  return showSuccessToast('Vault Created Successfully', 
    `Vault: ${vaultAddress.slice(0, 10)}... | Token: ${tokenAddress.slice(0, 10)}...`
  )
}

/**
 * Show minting success
 */
export function showMintSuccess(amount: string, tokenSymbol: string) {
  return showSuccessToast('Tokens Minted', 
    `Successfully minted ${amount} ${tokenSymbol} tokens`
  )
}

/**
 * Show redemption success
 */
export function showRedeemSuccess(amount: string, tokenSymbol: string, celoReceived: string) {
  return showSuccessToast('Tokens Redeemed', 
    `Redeemed ${amount} ${tokenSymbol} for ${celoReceived} CELO`
  )
}

/**
 * Show stage unlock success
 */
export function showStageUnlocked(stage: number) {
  return showSuccessToast('Stage Unlocked', 
    `Successfully unlocked Stage ${stage}`
  )
}

/**
 * Show bootstrap success
 */
export function showBootstrapSuccess() {
  return showSuccessToast('Vault Bootstrapped', 
    'Stage 1 unlocked! Fans can now mint tokens'
  )
}

/**
 * Show liquidation success
 */
export function showLiquidationSuccess(bounty: string) {
  return showSuccessToast('Liquidation Successful', 
    `Earned ${bounty} CELO bounty`
  )
}

/**
 * Show forced burn executed
 */
export function showForcedBurnExecuted(burnedAmount: string) {
  return showSuccessToast('Forced Burn Executed', 
    `Burned ${burnedAmount} excess tokens`
  )
}

/**
 * Network-specific toast helpers
 */

/**
 * Show wrong network warning
 */
export function showWrongNetworkWarning(currentNetwork: string, expectedNetwork: string) {
  return showWarningToast('Wrong Network', 
    `Please switch from ${currentNetwork} to ${expectedNetwork}`
  )
}

/**
 * Show network switch success
 */
export function showNetworkSwitched(networkName: string) {
  return showSuccessToast('Network Switched', 
    `Successfully switched to ${networkName}`
  )
}

/**
 * Wallet-specific toast helpers
 */

/**
 * Show wallet connected
 */
export function showWalletConnected(address: string) {
  return showSuccessToast('Wallet Connected', 
    `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`
  )
}

/**
 * Show wallet disconnected
 */
export function showWalletDisconnected() {
  return showInfoToast('Wallet Disconnected', 
    'Your wallet has been disconnected'
  )
}

/**
 * Promise-based toast wrapper for async operations
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error?: string | ((error: any) => string)
  }
): Promise<T> {
  toast.promise(promise, {
    loading: messages.loading,
    success: (data) => {
      return typeof messages.success === 'function' 
        ? messages.success(data) 
        : messages.success
    },
    error: (error) => {
      if (isUserRejection(error)) {
        return 'Transaction cancelled'
      }
      
      if (typeof messages.error === 'function') {
        return messages.error(error)
      }
      
      return messages.error || parseContractError(error)
    },
  })
  
  return promise
}