'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryState {
    hasError: boolean
    error?: Error
    errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ComponentType<ErrorFallbackProps>
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
    error: Error
    resetError: () => void
    errorInfo?: React.ErrorInfo
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({ error, resetError, errorInfo }: ErrorFallbackProps) {
    const isDevelopment = process.env.NODE_ENV === 'development'

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>

                <div className="text-center">
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">
                        Something went wrong
                    </h1>
                    <p className="text-gray-600 mb-6">
                        We encountered an unexpected error. Please try refreshing the page or go back to the home page.
                    </p>

                    {isDevelopment && (
                        <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Error Details:</h3>
                            <p className="text-xs text-gray-600 font-mono break-all">
                                {error.message}
                            </p>
                            {error.stack && (
                                <details className="mt-2">
                                    <summary className="text-xs text-gray-500 cursor-pointer">Stack Trace</summary>
                                    <pre className="text-xs text-gray-500 mt-1 whitespace-pre-wrap break-all">
                                        {error.stack}
                                    </pre>
                                </details>
                            )}
                            {errorInfo?.componentStack && (
                                <details className="mt-2">
                                    <summary className="text-xs text-gray-500 cursor-pointer">Component Stack</summary>
                                    <pre className="text-xs text-gray-500 mt-1 whitespace-pre-wrap break-all">
                                        {errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={resetError}
                            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * React Error Boundary component for catching and handling React errors
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 * 
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={CustomErrorComponent}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error details
        console.error('ErrorBoundary caught an error:', error, errorInfo)

        // Update state with error info
        this.setState({
            error,
            errorInfo,
        })

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo)
        }

        // In production, you might want to log this to an error reporting service
        if (process.env.NODE_ENV === 'production') {
            // Example: logErrorToService(error, errorInfo)
        }
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    }

    render() {
        if (this.state.hasError && this.state.error) {
            const FallbackComponent = this.props.fallback || DefaultErrorFallback

            return (
                <FallbackComponent
                    error={this.state.error}
                    resetError={this.resetError}
                    errorInfo={this.state.errorInfo}
                />
            )
        }

        return this.props.children
    }
}

/**
 * Hook-based error boundary for functional components
 * This creates a simple error boundary wrapper
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: React.ComponentType<ErrorFallbackProps>
) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary fallback={fallback}>
            <Component {...props} />
        </ErrorBoundary>
    )

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

    return WrappedComponent
}

/**
 * Compact error fallback for smaller components
 */
export function CompactErrorFallback({ error, resetError }: ErrorFallbackProps) {
    return (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Error occurred</span>
            </div>
            <p className="text-sm text-red-700 mb-3">
                {error.message || 'Something went wrong'}
            </p>
            <button
                onClick={resetError}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
            >
                Try Again
            </button>
        </div>
    )
}

/**
 * Error boundary specifically for async operations
 */
export function AsyncErrorBoundary({ children, onError }: ErrorBoundaryProps) {
    return (
        <ErrorBoundary
            fallback={({ error, resetError }) => (
                <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Loading Error</span>
                    </div>
                    <p className="text-sm text-yellow-700 mb-3">
                        Failed to load data. Please check your connection and try again.
                    </p>
                    <button
                        onClick={resetError}
                        className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}
            onError={onError}
        >
            {children}
        </ErrorBoundary>
    )
}