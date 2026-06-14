import type { CustomerOrder, CustomerOrderWithTotals } from './types'

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const RAW_ORDERS: CustomerOrder[] = [
  {
    id: 'co-001',
    orderRef: 'CO-001',
    orderDate: daysAgo(2),
    customerName: 'Banjul Builders',
    status: 'pending',
    notes: 'Customer to confirm delivery address before fulfillment',
    createdByName: 'Awa Sanneh',
    lineItems: [
      {
        id: 'coi-1a',
        customerOrderId: 'co-001',
        item: { id: 'item-1', name: 'OPC Cement', brand: 'Dangote', saleUnitAbbreviation: 'bag' },
        quantity: 200,
        quantityFulfilled: 0,
        agreedUnitPrice: 720,
      },
      {
        id: 'coi-1b',
        customerOrderId: 'co-001',
        item: { id: 'item-3', name: 'Steel Rod 12mm', brand: 'ISCOR', saleUnitAbbreviation: 'rod' },
        quantity: 100,
        quantityFulfilled: 0,
        agreedUnitPrice: 4100,
      },
    ],
    deposits: [
      { id: 'cod-1a', customerOrderId: 'co-001', amount: 150000, paymentDate: daysAgo(2), paymentMethod: 'transfer', notes: 'Initial deposit' },
    ],
    refunds: [],
    fulfillments: [],
  },
  {
    id: 'co-002',
    orderRef: 'CO-002',
    orderDate: daysAgo(8),
    customerName: 'Kombo Estates',
    status: 'partially_fulfilled',
    notes: null,
    createdByName: 'Lamin Touray',
    lineItems: [
      {
        id: 'coi-2a',
        customerOrderId: 'co-002',
        item: { id: 'item-4', name: 'Hollow Block 6"', brand: null, saleUnitAbbreviation: 'pc' },
        quantity: 1000,
        quantityFulfilled: 600,
        agreedUnitPrice: 390,
      },
      {
        id: 'coi-2b',
        customerOrderId: 'co-002',
        item: { id: 'item-5', name: 'Granite Gravel ¾"', brand: null, saleUnitAbbreviation: 'kg' },
        quantity: 3000,
        quantityFulfilled: 3000,
        agreedUnitPrice: 33,
      },
    ],
    deposits: [
      { id: 'cod-2a', customerOrderId: 'co-002', amount: 300000, paymentDate: daysAgo(8), paymentMethod: 'transfer', notes: null },
    ],
    refunds: [],
    fulfillments: [
      { id: 'cof-2a', customerOrderId: 'co-002', saleRef: 'S-010', fulfillmentDate: daysAgo(6), notes: 'First batch — gravel + part of blocks' },
    ],
  },
  {
    id: 'co-003',
    orderRef: 'CO-003',
    orderDate: daysAgo(20),
    customerName: 'Fajara Homes',
    status: 'fulfilled',
    notes: null,
    createdByName: 'Awa Sanneh',
    lineItems: [
      {
        id: 'coi-3a',
        customerOrderId: 'co-003',
        item: { id: 'item-7', name: 'GI Binding Wire', brand: 'Stallion', saleUnitAbbreviation: 'kg' },
        quantity: 60,
        quantityFulfilled: 60,
        agreedUnitPrice: 580,
      },
    ],
    deposits: [
      { id: 'cod-3a', customerOrderId: 'co-003', amount: 15000, paymentDate: daysAgo(20), paymentMethod: 'cash', notes: 'Deposit' },
      { id: 'cod-3b', customerOrderId: 'co-003', amount: 19800, paymentDate: daysAgo(15), paymentMethod: 'cash', notes: 'Balance on collection' },
    ],
    refunds: [],
    fulfillments: [
      { id: 'cof-3a', customerOrderId: 'co-003', saleRef: 'S-008', fulfillmentDate: daysAgo(15), notes: null },
    ],
  },
  {
    id: 'co-004',
    orderRef: 'CO-004',
    orderDate: daysAgo(12),
    customerName: 'Serrekunda Hardware',
    status: 'cancelled',
    notes: 'Customer cancelled — deposit refunded in full',
    createdByName: 'Lamin Touray',
    lineItems: [
      {
        id: 'coi-4a',
        customerOrderId: 'co-004',
        item: { id: 'item-6', name: 'Reinforced Column 200mm', brand: null, saleUnitAbbreviation: 'pc' },
        quantity: 10,
        quantityFulfilled: 0,
        agreedUnitPrice: 60000,
      },
    ],
    deposits: [
      { id: 'cod-4a', customerOrderId: 'co-004', amount: 100000, paymentDate: daysAgo(12), paymentMethod: 'transfer', notes: 'Deposit' },
    ],
    refunds: [
      { id: 'cor-4a', customerOrderId: 'co-004', amount: 100000, paymentDate: daysAgo(9), paymentMethod: 'transfer', notes: 'Full deposit refund on cancellation' },
    ],
    fulfillments: [],
  },
]

function buildWithTotals(o: CustomerOrder): CustomerOrderWithTotals {
  const orderTotal     = o.lineItems.reduce((s, li) => s + li.quantity * li.agreedUnitPrice, 0)
  const fulfilledValue = o.lineItems.reduce((s, li) => s + li.quantityFulfilled * li.agreedUnitPrice, 0)
  const totalDeposited = o.deposits.reduce((s, d) => s + d.amount, 0)
  const totalRefunded  = o.refunds.reduce((s, r) => s + r.amount, 0)
  const netDepositHeld = totalDeposited - totalRefunded

  const totalQty          = o.lineItems.reduce((s, li) => s + li.quantity, 0)
  const totalFulfilledQty = o.lineItems.reduce((s, li) => s + li.quantityFulfilled, 0)
  const fulfillmentPercent = totalQty === 0 ? 0 : Math.round((totalFulfilledQty / totalQty) * 100)

  return {
    ...o,
    orderTotal,
    fulfilledValue,
    totalDeposited,
    totalRefunded,
    netDepositHeld,
    balanceRemaining: orderTotal - netDepositHeld,
    fulfillmentPercent,
  }
}

export const MOCK_CUSTOMER_ORDERS: CustomerOrderWithTotals[] =
  RAW_ORDERS.map(buildWithTotals)
