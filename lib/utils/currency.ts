/**
 * Utility functions for currency handling
 * All amounts are stored in minor currency units (pence for GBP)
 */

export function formatCurrency(amountMinor: number, currency: string = 'GBP'): string {
  const amount = amountMinor / 100
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function parseCurrencyInput(input: string): number {
  // Remove currency symbols and convert to number
  const cleaned = input.replace(/[£$€,\s]/g, '')
  const amount = parseFloat(cleaned)
  if (isNaN(amount)) return 0
  return Math.round(amount * 100) // Convert to minor units
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}h`
}

export function formatRate(rateMinor: number, currency: string = 'GBP'): string {
  return `${formatCurrency(rateMinor, currency)}/hr`
}

export function calculatePercentage(actual: number, allocated: number): number {
  if (allocated === 0) return 0
  return Math.round((actual / allocated) * 100)
}

export function getVarianceColor(percentage: number): string {
  if (percentage < 75) return 'text-green-600'
  if (percentage < 90) return 'text-yellow-600'
  if (percentage < 100) return 'text-orange-600'
  return 'text-red-600'
}

export function getProgressColor(percentage: number): string {
  if (percentage < 75) return 'bg-green-500'
  if (percentage < 90) return 'bg-yellow-500'
  if (percentage < 100) return 'bg-orange-500'
  return 'bg-red-500'
}