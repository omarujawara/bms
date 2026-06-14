const CURRENCY_SYMBOL = 'D'

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL}${new Intl.NumberFormat('en').format(amount)}`
}

export function formatStock(amount: number): string {
  return new Intl.NumberFormat('en').format(amount)
}
