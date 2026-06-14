import type { SaleReturn, SaleReturnWithTotals } from './types'

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const RAW_RETURNS: SaleReturn[] = [
  {
    id: 'r-001',
    returnRef: 'R-001',
    originalSaleRef: 'S-003',
    originalTransactionId: 's-003',
    returnDate: daysAgo(0),
    customerName: 'Fatou Jallow',
    reason: 'Surplus material — project finished under estimate',
    notes: null,
    createdByName: 'Lamin Touray',
    lineItems: [
      {
        id: 'rli-1a',
        saleReturnId: 'r-001',
        saleItemId: 'sli-3b',
        item: { id: 'item-1', name: 'OPC Cement', brand: 'Dangote', saleUnitAbbreviation: 'bag' },
        quantitySold: 10,
        quantityReturned: 4,
        unitPriceRefunded: 760,
        unitCostFifo: 450,
      },
    ],
    payments: [
      { id: 'rp-1a', saleReturnId: 'r-001', amount: 3040, paymentDate: daysAgo(0), paymentMethod: 'cash', notes: 'Cash refund' },
    ],
  },
  {
    id: 'r-002',
    returnRef: 'R-002',
    originalSaleRef: 'S-005',
    originalTransactionId: 's-005',
    returnDate: daysAgo(2),
    customerName: 'GreenBuild Ltd',
    reason: 'Defective unit — cracked on delivery',
    notes: 'Replacement column issued separately under S-007',
    createdByName: 'Awa Sanneh',
    lineItems: [
      {
        id: 'rli-2a',
        saleReturnId: 'r-002',
        saleItemId: 'sli-5a',
        item: { id: 'item-6', name: 'Reinforced Column 200mm', brand: null, saleUnitAbbreviation: 'pc' },
        quantitySold: 3,
        quantityReturned: 1,
        unitPriceRefunded: 62000,
        unitCostFifo: 45000,
      },
    ],
    payments: [
      { id: 'rp-2a', saleReturnId: 'r-002', amount: 62000, paymentDate: daysAgo(2), paymentMethod: 'transfer', notes: 'Full refund for defective unit' },
    ],
  },
  {
    id: 'r-003',
    returnRef: 'R-003',
    originalSaleRef: 'S-001',
    originalTransactionId: 's-001',
    returnDate: daysAgo(0),
    customerName: 'Modou Construction',
    reason: 'Over-ordered steel rods',
    notes: 'Refund pending — to be settled against outstanding balance',
    createdByName: 'Awa Sanneh',
    lineItems: [
      {
        id: 'rli-3a',
        saleReturnId: 'r-003',
        saleItemId: 'sli-1b',
        item: { id: 'item-3', name: 'Steel Rod 12mm', brand: 'ISCOR', saleUnitAbbreviation: 'rod' },
        quantitySold: 20,
        quantityReturned: 5,
        unitPriceRefunded: 4200,
        unitCostFifo: 3500,
      },
    ],
    payments: [],  // refund not yet paid out
  },
  {
    id: 'r-004',
    returnRef: 'R-004',
    originalSaleRef: 'S-003',
    originalTransactionId: 's-003',
    returnDate: daysAgo(5),
    customerName: 'Fatou Jallow',
    reason: 'Wrong aggregate grade supplied',
    notes: null,
    createdByName: 'Lamin Touray',
    lineItems: [
      {
        id: 'rli-4a',
        saleReturnId: 'r-004',
        saleItemId: 'sli-3a',
        item: { id: 'item-5', name: 'Granite Gravel ¾"', brand: null, saleUnitAbbreviation: 'kg' },
        quantitySold: 1000,
        quantityReturned: 300,
        unitPriceRefunded: 35,
        unitCostFifo: 22,
      },
    ],
    payments: [
      { id: 'rp-4a', saleReturnId: 'r-004', amount: 10500, paymentDate: daysAgo(5), paymentMethod: 'cash', notes: null },
    ],
  },
]

function buildWithTotals(r: SaleReturn): SaleReturnWithTotals {
  const totalRefund       = r.lineItems.reduce((s, li) => s + li.quantityReturned * li.unitPriceRefunded, 0)
  const totalCostRestored = r.lineItems.reduce((s, li) => s + li.quantityReturned * li.unitCostFifo, 0)
  const totalRefunded     = r.payments.reduce((s, p) => s + p.amount, 0)
  return {
    ...r,
    totalRefund,
    totalCostRestored,
    totalRefunded,
    refundOutstanding: totalRefund - totalRefunded,
  }
}

export const MOCK_RETURNS: SaleReturnWithTotals[] = RAW_RETURNS.map(buildWithTotals)
