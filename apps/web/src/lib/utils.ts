import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS class names, resolving conflicts intelligently.
 * Use this for all conditional class composition in components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number with locale-appropriate separators.
 * @example formatNumber(1234567) → "1,234,567"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString()
}

/**
 * Truncates a string to a maximum length, appending "..." if truncated.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}
