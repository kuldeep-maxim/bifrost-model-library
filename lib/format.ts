/**
 * Number formatting utilities that are SSR-safe (no hydration mismatches)
 */

/**
 * Format a number with comma separators (SSR-safe)
 * Uses a consistent format regardless of locale to prevent hydration errors
 *
 * @example
 * formatNumber(1000) => "1,000"
 * formatNumber(1000000) => "1,000,000"
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format a large number with K/M suffix for better readability
 *
 * @example
 * formatCompactNumber(1500) => "1,500"
 * formatCompactNumber(150000) => "150k"
 * formatCompactNumber(1500000) => "1.5M"
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 100_000) {
    return `${Math.floor(num / 1000)}k`;
  }
  return formatNumber(num);
}

/**
 * Format a token count for display
 * - Numbers >= 100k get abbreviated (e.g., "128k")
 * - Numbers < 100k get comma separators (e.g., "32,768")
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 100_000) {
    return `${Math.floor(tokens / 1000)}k`;
  }
  return formatNumber(tokens);
}

/**
 * Format currency with proper dollar sign and decimals
 *
 * @example
 * formatCurrency(1.50) => "$1.50"
 * formatCurrency(0.005) => "$0.01"
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format a very small number for display (e.g., cost per token)
 *
 * @example
 * formatSmallNumber(0.000015) => "0.000015"
 * formatSmallNumber(0.0000001) => "0.0000001"
 */
export function formatSmallNumber(num: number): string {
  // For very small numbers, use fixed notation
  if (num < 0.000001) {
    return num.toFixed(9);
  }
  if (num < 0.0001) {
    return num.toFixed(7);
  }
  return num.toFixed(6);
}
