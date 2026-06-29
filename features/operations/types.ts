// ─── Stock Adjustments ────────────────────────────────────────

// Adjustments REMOVE stock only (quantity is always positive = amount
// removed, in base units). Stock additions are handled as inventory batches.
export type StockAdjustmentReason =
  | 'internal_use'
  | 'damaged'
  | 'given_away'
  | 'correction'
  | 'missing'

export type StockAdjustmentAllocation = {
  id: string
  batchId: string
  quantity: number    // base units drawn from this batch
  unitCost: number    // cost from this batch — owner-only
}

export type StockAdjustment = {
  id: string
  adjustmentRef: string      // display label e.g. "ADJ-001"
  item: {
    id: string
    name: string
    brand: string | null
    baseUnitAbbreviation: string
  }
  quantity: number           // amount removed, base units
  reason: StockAdjustmentReason
  unitCostFifo: number       // FIFO weighted-avg cost per base unit — OWNER ONLY
  notes: string | null
  createdByName: string
  createdAt: string
  allocations: StockAdjustmentAllocation[]  // owner-only
}

export type StockAdjustmentWithTotals = StockAdjustment & {
  totalCost: number          // quantity × unitCostFifo — owner-only
}

// ─── Expenses ─────────────────────────────────────────────────

export type Expense = {
  id: string
  categoryName: string       // expense-type category
  amount: number
  expenseDate: string
  description: string
  createdByName: string
}
