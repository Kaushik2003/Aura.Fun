import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format an Ethereum address for display
 * @param address - The full address
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Formatted address like "0x1234...5678"
 */
export function formatAddress(address?: string, startChars = 6, endChars = 4): string {
  if (!address) return ''
  if (address.length <= startChars + endChars) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Check if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash?: string): string {
  if (!hash) return ''
  if (hash.length < 10) return hash
  
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`
}

/**
 * Check if a transaction hash is valid
 */
export function isValidTxHash(hash?: string): boolean {
  if (!hash) return false
  return /^0x[a-fA-F0-9]{64}$/.test(hash)
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 */
export function formatNumber(num: number, decimals = 2): string {
  if (num === 0) return '0'
  
  const k = 1000
  const sizes = ['', 'K', 'M', 'B', 'T']
  
  const i = Math.floor(Math.log(Math.abs(num)) / Math.log(k))
  
  if (i === 0) {
    return num.toFixed(decimals === 0 ? 0 : Math.min(decimals, 2))
  }
  
  return (num / Math.pow(k, i)).toFixed(decimals) + sizes[i]
}

/**
 * Format percentage with specified decimal places
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}