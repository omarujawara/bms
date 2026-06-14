export type PaymentMethod = 'cash' | 'transfer' | 'other'

export type SaleReturnItem = {
  id: string
  saleReturnId: string
  saleItemId: string        // the original sale line being returned
  item: {
    id: string
    name: string
    brand: string | null
    saleUnitAbbreviation: string
  }
  quantitySold: number       // original quantity on the sale line (for over-return context)
  quantityReturned: number   // sale units being returned now
  unitPriceRefunded: number  // refund price per sale unit
  unitCostFifo: number       // cost restored per sale unit — OWNER ONLY
}

export type SaleReturnPayment = {
  id: string
  saleReturnId: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  notes: string | null
}

export type SaleReturn = {
  id: string
  returnRef: string          // display label e.g. "R-001"
  originalSaleRef: string    // the sale this return came from e.g. "S-003"
  originalTransactionId: string
  returnDate: string
  customerName: string | null
  reason: string | null
  notes: string | null
  createdByName: string
  lineItems: SaleReturnItem[]
  payments: SaleReturnPayment[]
}

// Enriched with derived totals. Cost/profit-impact fields are owner-only.
export type SaleReturnWithTotals = SaleReturn & {
  totalRefund: number        // sum of (quantityReturned × unitPriceRefunded)
  totalCostRestored: number  // sum of (quantityReturned × unitCostFifo) — owner-only
  totalRefunded: number      // sum of refund payments actually paid out
  refundOutstanding: number  // totalRefund − totalRefunded
}
