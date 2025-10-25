/**
 * Error testing utilities for development and debugging
 * This file helps test various error scenarios in development
 */

import { parseContractError, parseContractErrorWithContext } from './error-parser'
import { showErrorToast, showTransactionError } from './toast-config'

/**
 * Mock error scenarios for testing
 */
export const MOCK_ERRORS = {
  // Contract errors
  insufficientCollateral: new Error('execution reverted: InsufficientCollateral'),
  stageNotUnlocked: new Error('execution reverted: StageNotUnlocked'),
  exceedsStageCap: new Error('execution reverted: ExceedsStageCap'),
  exceedsSupplyCap: new Error('execution reverted: ExceedsSupplyCap'),
  healthTooLow: new Error('execution reverted: HealthTooLow'),
  notLiquidatable: new Error('execution reverted: NotLiquidatable'),
  onlyCreator: new Error('execution reverted: OnlyCreator'),
  zeroAmount: new Error('execution reverted: ZeroAmount'),
  
  // ERC20 errors
  insufficientBalance: new Error('execution reverted: ERC20InsufficientBalance'),
  insufficientAllowance: new Error('execution reverted: ERC20InsufficientAllowance'),
  
  // Network errors
  userRejection: Object.assign(new Error('User rejected the request'), { code: 4001 }),
  insufficientFunds: Object.assign(new Error('insufficient funds for gas'), { code: -32000 }),
  networkError: Object.assign(new Error('network connection failed'), { code: 'NETWORK_ERROR' }),
  wrongNetwork: new Error('ChainMismatchError: Expected chain 31337 but received 1'),
  contractNotFound: Object.assign(new Error('contract not deployed'), { code: 'CALL_EXCEPTION' }),
  
  // Generic errors
  unknownError: new Error('Something went wrong'),
  nullError: null,
  stringError: 'Transaction failed',
}

/**
 * Test error parsing with various error types
 */
export function testErrorParsing() {
  console.group('🧪 Testing Error Parsing')
  
  Object.entries(MOCK_ERRORS).forEach(([name, error]) => {
    console.log(`\n${name}:`)
    console.log('  Original:', error)
    console.log('  Parsed:', parseContractError(error))
    
    const contextResult = parseContractErrorWithContext(error, {
      action: 'mint',
      contract: 'CreatorVault',
      function: 'mintTokens'
    })
    console.log('  With context:', contextResult)
  })
  
  console.groupEnd()
}

/**
 * Test toast notifications with various errors
 */
export function testErrorToasts() {
  console.log('🧪 Testing Error Toasts')
  
  // Test basic error toast
  setTimeout(() => {
    showErrorToast(MOCK_ERRORS.insufficientCollateral, 'Fallback message')
  }, 1000)
  
  // Test transaction error with context
  setTimeout(() => {
    showTransactionError('Mint', MOCK_ERRORS.stageNotUnlocked, {
      contract: 'CreatorVault',
      function: 'mintTokens'
    })
  }, 2000)
  
  // Test user rejection (should not show toast)
  setTimeout(() => {
    showErrorToast(MOCK_ERRORS.userRejection)
  }, 3000)
  
  // Test network error
  setTimeout(() => {
    showErrorToast(MOCK_ERRORS.networkError)
  }, 4000)
}

/**
 * Simulate various error scenarios for testing
 */
export class ErrorSimulator {
  /**
   * Simulate a contract call that fails with specific error
   */
  static async simulateContractError(errorType: keyof typeof MOCK_ERRORS): Promise<never> {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
    throw MOCK_ERRORS[errorType]
  }
  
  /**
   * Simulate a transaction that fails after being submitted
   */
  static async simulateTransactionError(errorType: keyof typeof MOCK_ERRORS): Promise<never> {
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate longer delay
    throw MOCK_ERRORS[errorType]
  }
  
  /**
   * Simulate random error for stress testing
   */
  static async simulateRandomError(): Promise<never> {
    const errorTypes = Object.keys(MOCK_ERRORS) as Array<keyof typeof MOCK_ERRORS>
    const randomType = errorTypes[Math.floor(Math.random() * errorTypes.length)]
    return this.simulateContractError(randomType)
  }
}

/**
 * Error boundary testing utilities
 */
export class ErrorBoundaryTester {
  /**
   * Throw an error to test error boundary
   */
  static throwRenderError(message = 'Test render error') {
    throw new Error(message)
  }
  
  /**
   * Throw an async error to test error boundary
   */
  static async throwAsyncError(message = 'Test async error') {
    await new Promise(resolve => setTimeout(resolve, 100))
    throw new Error(message)
  }
  
  /**
   * Create a component that throws an error
   */
  static createErrorComponent(errorMessage = 'Test component error') {
    return function ErrorComponent() {
      throw new Error(errorMessage)
    }
  }
}

/**
 * Development-only error testing commands
 * These can be called from browser console during development
 */
if (process.env.NODE_ENV === 'development') {
  // Make testing functions available globally for console access
  ;(window as any).testErrorParsing = testErrorParsing
  ;(window as any).testErrorToasts = testErrorToasts
  ;(window as any).ErrorSimulator = ErrorSimulator
  ;(window as any).ErrorBoundaryTester = ErrorBoundaryTester
  
  console.log('🧪 Error testing utilities loaded. Available commands:')
  console.log('  testErrorParsing() - Test error message parsing')
  console.log('  testErrorToasts() - Test error toast notifications')
  console.log('  ErrorSimulator.simulateContractError("errorType") - Simulate contract errors')
  console.log('  ErrorBoundaryTester.throwRenderError() - Test error boundary')
}

/**
 * Error reporting utilities for production
 */
export class ErrorReporter {
  /**
   * Report error to external service (placeholder)
   */
  static reportError(error: Error, context?: {
    userId?: string
    action?: string
    component?: string
    additionalData?: Record<string, any>
  }) {
    if (process.env.NODE_ENV === 'production') {
      // In production, you would send this to your error reporting service
      // Example: Sentry, LogRocket, Bugsnag, etc.
      console.error('Error reported:', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
    }
  }
  
  /**
   * Report contract interaction error
   */
  static reportContractError(error: any, context: {
    contract: string
    function: string
    parameters?: any[]
    userAddress?: string
  }) {
    this.reportError(error, {
      action: 'contract_interaction',
      component: 'web3',
      additionalData: context,
    })
  }
  
  /**
   * Report UI error
   */
  static reportUIError(error: Error, context: {
    component: string
    props?: Record<string, any>
    userAddress?: string
  }) {
    this.reportError(error, {
      action: 'ui_error',
      component: context.component,
      additionalData: context,
    })
  }
}