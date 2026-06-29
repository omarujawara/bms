export type PaymentMethod = 'cash' | 'transfer' | 'other'

export type PurchaseOrderStatus =
  | 'pending_delivery'
  | 'partially_received'
  | 'received'
  | 'cancelled'

export type PurchaseOrderLineItem = {
  id: string
  purchaseOrderId: string
  item: {
    id: string
    name: string
    brand: string | null
    purchaseUnitAbbreviation: string
  }
  quantityOrdered: number    // purchase units
  quantityReceived: number   // purchase units
  unitCost: number           // per purchase unit
}

export type PurchasePayment = {
  id: string
  purchaseOrderId: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  notes: string | null
}

export type PurchaseOrder = {
  id: string
  orderRef: string           // display label e.g. "PO-001"
  orderDate: string
  status: PurchaseOrderStatus
  notes: string | null
  lineItems: PurchaseOrderLineItem[]
  payments: PurchasePayment[]
}

// Enriched with totals computed from line items + payments
export type PurchaseOrderWithTotals = PurchaseOrder & {
  totalCost: number          // sum of (quantityOrdered × unitCost)
  totalPaid: number          // sum of payments
  balanceDue: number         // totalCost − totalPaid
}
