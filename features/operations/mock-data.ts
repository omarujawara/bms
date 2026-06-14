import type { Expense, StockAdjustment, StockAdjustmentWithTotals } from './types'

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function timestampDaysAgo(days: number, hour = 12): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

// ─── Stock Adjustments ────────────────────────────────────────

const RAW_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: 'adj-001',
    adjustmentRef: 'ADJ-001',
    item: { id: 'item-4', name: 'Hollow Block 6"', brand: null, baseUnitAbbreviation: 'pc' },
    quantity: 35,
    reason: 'damaged',
    unitCostFifo: 250,
    notes: 'Cracked during yard reshuffle',
    createdByName: 'Lamin Touray',
    createdAt: timestampDaysAgo(1, 10),
    allocations: [
      { id: 'adja-1a', batchId: 'b-4a', quantity: 35, unitCost: 250 },
    ],
  },
  {
    id: 'adj-002',
    adjustmentRef: 'ADJ-002',
    item: { id: 'item-1', name: 'OPC Cement', brand: 'Dangote', baseUnitAbbreviation: 'kg' },
    quantity: 100,
    reason: 'internal_use',
    unitCostFifo: 450,
    notes: 'Used for office store-room floor repair',
    createdByName: 'Awa Sanneh',
    createdAt: timestampDaysAgo(3, 14),
    allocations: [
      { id: 'adja-2a', batchId: 'b-1a', quantity: 100, unitCost: 450 },
    ],
  },
  {
    id: 'adj-003',
    adjustmentRef: 'ADJ-003',
    item: { id: 'item-2', name: 'Fine Sand', brand: null, baseUnitAbbreviation: 'kg' },
    quantity: 400,
    reason: 'missing',
    unitCostFifo: 16.5,
    notes: 'Stock count shortfall — suspected spillage/loss',
    createdByName: 'Awa Sanneh',
    createdAt: timestampDaysAgo(6, 9),
    allocations: [
      { id: 'adja-3a', batchId: 'b-2a', quantity: 250, unitCost: 15 },
      { id: 'adja-3b', batchId: 'b-2b', quantity: 150, unitCost: 18 },
    ],
  },
  {
    id: 'adj-004',
    adjustmentRef: 'ADJ-004',
    item: { id: 'item-7', name: 'GI Binding Wire', brand: 'Stallion', baseUnitAbbreviation: 'kg' },
    quantity: 5,
    reason: 'given_away',
    unitCostFifo: 380,
    notes: 'Sample given to prospective contract customer',
    createdByName: 'Lamin Touray',
    createdAt: timestampDaysAgo(10, 16),
    allocations: [
      { id: 'adja-4a', batchId: 'b-7a', quantity: 5, unitCost: 380 },
    ],
  },
  {
    id: 'adj-005',
    adjustmentRef: 'ADJ-005',
    item: { id: 'item-5', name: 'Granite Gravel ¾"', brand: null, baseUnitAbbreviation: 'kg' },
    quantity: 200,
    reason: 'correction',
    unitCostFifo: 22,
    notes: 'Over-counted at last stocktake — correcting down',
    createdByName: 'Awa Sanneh',
    createdAt: timestampDaysAgo(14, 11),
    allocations: [
      { id: 'adja-5a', batchId: 'b-5a', quantity: 200, unitCost: 22 },
    ],
  },
]

function buildAdjustmentTotals(a: StockAdjustment): StockAdjustmentWithTotals {
  return { ...a, totalCost: a.quantity * a.unitCostFifo }
}

export const MOCK_STOCK_ADJUSTMENTS: StockAdjustmentWithTotals[] =
  RAW_ADJUSTMENTS.map(buildAdjustmentTotals)

// ─── Expenses ─────────────────────────────────────────────────

export const MOCK_EXPENSES: Expense[] = [
  { id: 'exp-001', categoryName: 'Transport', amount: 12000, expenseDate: daysAgo(1),  description: 'Truck fuel for site deliveries', createdByName: 'Awa Sanneh' },
  { id: 'exp-002', categoryName: 'Utilities', amount: 8500,  expenseDate: daysAgo(2),  description: 'Electricity bill — yard and office', createdByName: 'Awa Sanneh' },
  { id: 'exp-003', categoryName: 'Wages',     amount: 25000, expenseDate: daysAgo(4),  description: 'Casual loading labour (3 days)', createdByName: 'Awa Sanneh' },
  { id: 'exp-004', categoryName: 'Maintenance', amount: 6300, expenseDate: daysAgo(7), description: 'Forklift servicing and hydraulic oil', createdByName: 'Lamin Touray' },
  { id: 'exp-005', categoryName: 'Rent',      amount: 60000, expenseDate: daysAgo(12), description: 'Monthly yard rent', createdByName: 'Awa Sanneh' },
  { id: 'exp-006', categoryName: 'Supplies',  amount: 3400,  expenseDate: daysAgo(15), description: 'Office stationery and printer ink', createdByName: 'Lamin Touray' },
  { id: 'exp-007', categoryName: 'Transport', amount: 9800,  expenseDate: daysAgo(20), description: 'Delivery van tyre replacement', createdByName: 'Awa Sanneh' },
]
