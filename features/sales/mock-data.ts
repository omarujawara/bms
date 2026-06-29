import type { SalesTransaction, SalesTransactionWithTotals } from './types'

// Dates are generated relative to "now" so the same-day edit rule
// (isEditable) is demonstrable without editing mock data each day.
function daysAgo(days: number, hour = 10, minute = 30): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function dateOnly(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10)
}

function isToday(isoTimestamp: string): boolean {
  return dateOnly(isoTimestamp) === new Date().toISOString().slice(0, 10)
}

const TODAY     = daysAgo(0, 9, 15)
const TODAY_2   = daysAgo(0, 14, 40)
const YESTERDAY = daysAgo(1, 16, 0)

const RAW_TRANSACTIONS: SalesTransaction[] = [
  {
    id: 's-001',
    saleRef: 'S-001',
    transactionDate: TODAY,
    customerName: 'Modou Construction',
    notes: 'Site delivery to Brusubi',
    createdByName: 'Awa Sanneh',
    lineItems: [
      {
        id: 'sli-1a',
        salesTransactionId: 's-001',
        item: { id: 'item-1', name: 'OPC Cement', brand: 'Dangote', saleUnitAbbreviation: 'bag' },
        quantity: 40,
        unitPrice: 750,
        unitCostFifo: 460,
        allocations: [
          { id: 'al-1a1', batchId: 'b-1a', quantity: 1500, unitCost: 450 },
          { id: 'al-1a2', batchId: 'b-1b', quantity: 500,  unitCost: 480 },
        ],
      },
      {
        id: 'sli-1b',
        salesTransactionId: 's-001',
        item: { id: 'item-3', name: 'Steel Rod 12mm', brand: 'ISCOR', saleUnitAbbreviation: 'rod' },
        quantity: 20,
        unitPrice: 4200,
        unitCostFifo: 3500,
        allocations: [
          { id: 'al-1b1', batchId: 'b-3a', quantity: 20, unitCost: 3500 },
        ],
      },
    ],
    payments: [
      { id: 'sp-1a', salesTransactionId: 's-001', amount: 50000, paymentDate: dateOnly(TODAY), paymentMethod: 'transfer', notes: 'Part payment' },
    ],
  },
  {
    id: 's-002',
    saleRef: 'S-002',
    transactionDate: TODAY_2,
    customerName: null,  // walk-in, no name captured
    notes: null,
    createdByName: 'Awa Sanneh',
    lineItems: [
      {
        id: 'sli-2a',
        salesTransactionId: 's-002',
        item: { id: 'item-4', name: 'Hollow Block 6"', brand: null, saleUnitAbbreviation: 'pc' },
        quantity: 50,
        unitPrice: 400,
        unitCostFifo: 250,
        allocations: [
          { id: 'al-2a1', batchId: 'b-4a', quantity: 50, unitCost: 250 },
        ],
      },
    ],
    payments: [
      { id: 'sp-2a', salesTransactionId: 's-002', amount: 20000, paymentDate: dateOnly(TODAY_2), paymentMethod: 'cash', notes: null },
    ],
  },
  {
    id: 's-003',
    saleRef: 'S-003',
    transactionDate: YESTERDAY,
    customerName: 'Fatou Jallow',
    notes: null,
    createdByName: 'Lamin Touray',
    lineItems: [
      {
        id: 'sli-3a',
        salesTransactionId: 's-003',
        item: { id: 'item-5', name: 'Granite Gravel ¾"', brand: null, saleUnitAbbreviation: 'kg' },
        quantity: 1000,
        unitPrice: 35,
        unitCostFifo: 22,
        allocations: [
          { id: 'al-3a1', batchId: 'b-5a', quantity: 1000, unitCost: 22 },
        ],
      },
      {
        id: 'sli-3b',
        salesTransactionId: 's-003',
        item: { id: 'item-1', name: 'OPC Cement', brand: 'Dangote', saleUnitAbbreviation: 'bag' },
        quantity: 10,
        unitPrice: 760,
        unitCostFifo: 450,
        allocations: [
          { id: 'al-3b1', batchId: 'b-1a', quantity: 500, unitCost: 450 },
        ],
      },
    ],
    payments: [
      { id: 'sp-3a', salesTransactionId: 's-003', amount: 42600, paymentDate: dateOnly(YESTERDAY), paymentMethod: 'transfer', notes: 'Paid in full' },
    ],
  },
  {
    id: 's-004',
    saleRef: 'S-004',
    transactionDate: daysAgo(3, 11, 0),
    customerName: 'Saul Frazer',
    notes: 'Unpaid — agreed to settle on credit within 7 days',
    createdByName: 'Lamin Touray',
    lineItems: [
      {
        id: 'sli-4a',
        salesTransactionId: 's-004',
        item: { id: 'item-7', name: 'GI Binding Wire', brand: 'Stallion', saleUnitAbbreviation: 'kg' },
        quantity: 30,
        unitPrice: 600,
        unitCostFifo: 380,
        allocations: [
          { id: 'al-4a1', batchId: 'b-7b', quantity: 30, unitCost: 380 },
        ],
      },
    ],
    payments: [],  // fully unpaid
  },
  {
    id: 's-005',
    saleRef: 'S-005',
    transactionDate: daysAgo(6, 9, 30),
    customerName: 'GreenBuild Ltd',
    notes: null,
    createdByName: 'Awa Sanneh',
    lineItems: [
      {
        id: 'sli-5a',
        salesTransactionId: 's-005',
        item: { id: 'item-6', name: 'Reinforced Column 200mm', brand: null, saleUnitAbbreviation: 'pc' },
        quantity: 3,
        unitPrice: 62000,
        unitCostFifo: 45000,
        allocations: [
          { id: 'al-5a1', batchId: 'b-6a', quantity: 3, unitCost: 45000 },
        ],
      },
    ],
    payments: [
      { id: 'sp-5a', salesTransactionId: 's-005', amount: 186000, paymentDate: dateOnly(daysAgo(6)), paymentMethod: 'transfer', notes: 'Paid in full' },
    ],
  },
]

function buildWithTotals(t: SalesTransaction): SalesTransactionWithTotals {
  const totalRevenue = t.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0)
  const totalCost    = t.lineItems.reduce((s, li) => s + li.quantity * li.unitCostFifo, 0)
  const totalPaid    = t.payments.reduce((s, p) => s + p.amount, 0)
  return {
    ...t,
    totalRevenue,
    totalCost,
    totalProfit: totalRevenue - totalCost,
    totalPaid,
    balanceDue: totalRevenue - totalPaid,
    isEditable: isToday(t.transactionDate),
  }
}

export const MOCK_SALES: SalesTransactionWithTotals[] =
  RAW_TRANSACTIONS.map(buildWithTotals)
