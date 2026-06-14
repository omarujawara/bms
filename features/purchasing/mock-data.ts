import type {
  PurchaseOrder,
  PurchaseOrderWithTotals,
} from './types'

const RAW_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-001',
    orderRef: 'PO-001',
    orderDate: '2024-02-01',
    status: 'received',
    notes: null,
    lineItems: [
      {
        id: 'li-1a',
        purchaseOrderId: 'po-001',
        item: { id: 'item-1', name: 'OPC Cement', brand: 'Dangote', purchaseUnitAbbreviation: 'bag' },
        quantityOrdered: 100,
        quantityReceived: 100,
        unitCost: 620,
      },
      {
        id: 'li-1b',
        purchaseOrderId: 'po-001',
        item: { id: 'item-1b', name: 'Surecrete Cement', brand: 'Surecrete', purchaseUnitAbbreviation: 'bag' },
        quantityOrdered: 60,
        quantityReceived: 60,
        unitCost: 580,
      },
    ],
    payments: [
      {
        id: 'pay-1a',
        purchaseOrderId: 'po-001',
        amount: 40000,
        paymentDate: '2024-01-30',
        paymentMethod: 'transfer',
        notes: 'Deposit before delivery',
      },
      {
        id: 'pay-1b',
        purchaseOrderId: 'po-001',
        amount: 56800,
        paymentDate: '2024-02-03',
        paymentMethod: 'cash',
        notes: 'Balance on receipt',
      },
    ],
  },
  {
    id: 'po-002',
    orderRef: 'PO-002',
    orderDate: '2024-02-10',
    status: 'partially_received',
    notes: 'Steel delivery in two trips — second trip expected next week',
    lineItems: [
      {
        id: 'li-2a',
        purchaseOrderId: 'po-002',
        item: { id: 'item-3', name: 'Steel Rod 12mm', brand: 'ISCOR', purchaseUnitAbbreviation: 'bndl' },
        quantityOrdered: 10,
        quantityReceived: 6,
        unitCost: 42000,
      },
      {
        id: 'li-2b',
        purchaseOrderId: 'po-002',
        item: { id: 'item-2', name: 'Fine Sand', brand: null, purchaseUnitAbbreviation: 't' },
        quantityOrdered: 5,
        quantityReceived: 5,
        unitCost: 2200,
      },
    ],
    payments: [
      {
        id: 'pay-2a',
        purchaseOrderId: 'po-002',
        amount: 220000,
        paymentDate: '2024-02-12',
        paymentMethod: 'transfer',
        notes: null,
      },
    ],
  },
  {
    id: 'po-003',
    orderRef: 'PO-003',
    orderDate: '2024-05-18',
    status: 'pending_delivery',
    notes: 'Supplier confirmed delivery on 2024-05-25',
    lineItems: [
      {
        id: 'li-3a',
        purchaseOrderId: 'po-003',
        item: { id: 'item-4', name: 'Hollow Block 6"', brand: null, purchaseUnitAbbreviation: 'pc' },
        quantityOrdered: 1000,
        quantityReceived: 0,
        unitCost: 320,
      },
    ],
    payments: [],
  },
  {
    id: 'po-004',
    orderRef: 'PO-004',
    orderDate: '2024-05-20',
    status: 'received',
    notes: null,
    lineItems: [
      {
        id: 'li-4a',
        purchaseOrderId: 'po-004',
        item: { id: 'item-5', name: 'Granite Gravel ¾"', brand: null, purchaseUnitAbbreviation: 't' },
        quantityOrdered: 8,
        quantityReceived: 8,
        unitCost: 28000,
      },
      {
        id: 'li-4b',
        purchaseOrderId: 'po-004',
        item: { id: 'item-2', name: 'River Sand', brand: null, purchaseUnitAbbreviation: 't' },
        quantityOrdered: 3,
        quantityReceived: 3,
        unitCost: 18000,
      },
    ],
    payments: [
      {
        id: 'pay-4a',
        purchaseOrderId: 'po-004',
        amount: 180000,
        paymentDate: '2024-05-22',
        paymentMethod: 'transfer',
        notes: null,
      },
    ],
  },
  {
    id: 'po-005',
    orderRef: 'PO-005',
    orderDate: '2024-05-25',
    status: 'pending_delivery',
    notes: null,
    lineItems: [
      {
        id: 'li-5a',
        purchaseOrderId: 'po-005',
        item: { id: 'item-7', name: 'GI Binding Wire', brand: 'Stallion', purchaseUnitAbbreviation: 'roll' },
        quantityOrdered: 10,
        quantityReceived: 0,
        unitCost: 5500,
      },
    ],
    payments: [
      {
        id: 'pay-5a',
        purchaseOrderId: 'po-005',
        amount: 20000,
        paymentDate: '2024-05-25',
        paymentMethod: 'cash',
        notes: 'Deposit',
      },
    ],
  },
  {
    id: 'po-006',
    orderRef: 'PO-006',
    orderDate: '2024-03-10',
    status: 'cancelled',
    notes: 'Supplier could not fulfil order — switched to local source',
    lineItems: [
      {
        id: 'li-6a',
        purchaseOrderId: 'po-006',
        item: { id: 'item-8', name: 'Marine Plywood ¾"', brand: 'Berger', purchaseUnitAbbreviation: 'sht' },
        quantityOrdered: 50,
        quantityReceived: 0,
        unitCost: 22500,
      },
    ],
    payments: [],
  },
]

function buildWithTotals(order: PurchaseOrder): PurchaseOrderWithTotals {
  const totalCost = order.lineItems.reduce(
    (sum, li) => sum + li.quantityOrdered * li.unitCost, 0
  )
  const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0)
  return { ...order, totalCost, totalPaid, balanceDue: totalCost - totalPaid }
}

export const MOCK_PURCHASE_ORDERS: PurchaseOrderWithTotals[] =
  RAW_ORDERS.map(buildWithTotals)
