export type PaymentMethod = 'cash' | 'transfer' | 'other'

export type SaleItemBatchAllocation = {
  id: string
  batchId: string
  quantity: number    // base units
  unitCost: number    // cost from this batch — owner-only
}

export type SaleItem = {
  id: string
  salesTransactionId: string
  item: {
    id: string
    name: string
    brand: string | null
    saleUnitAbbreviation: string
  }
  quantity: number          // sale units
  unitPrice: number         // what the customer pays per sale unit
  unitCostFifo: number      // FIFO weighted-avg cost per sale unit — OWNER ONLY
  allocations: SaleItemBatchAllocation[]  // owner-only
}

export type SalePayment = {
  id: string
  salesTransactionId: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  notes: string | null
}

export type SalesTransaction = {
  id: string
  saleRef: string           // display label e.g. "S-001"
  transactionDate: string   // ISO timestamp
  customerName: string | null
  notes: string | null
  createdByName: string     // staff display name
  lineItems: SaleItem[]
  payments: SalePayment[]
}

// Enriched with derived totals. Cost/profit fields are owner-only;
// the UI gates them behind the role check, never the data shape.
export type SalesTransactionWithTotals = SalesTransaction & {
  totalRevenue: number      // sum of (quantity × unitPrice)
  totalCost: number         // sum of (quantity × unitCostFifo) — owner-only
  totalProfit: number       // totalRevenue − totalCost — owner-only
  totalPaid: number         // sum of payments
  balanceDue: number        // totalRevenue − totalPaid
  isEditable: boolean       // same-day edit rule: created today
}
