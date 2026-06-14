export type PaymentMethod = 'cash' | 'transfer' | 'other'

export type CustomerOrderStatus =
  | 'pending'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'cancelled'

export type CustomerOrderItem = {
  id: string
  customerOrderId: string
  item: {
    id: string
    name: string
    brand: string | null
    saleUnitAbbreviation: string
  }
  quantity: number           // ordered, in sale units
  quantityFulfilled: number  // auto-maintained by DB trigger on fulfillment
  agreedUnitPrice: number    // price locked at order time
}

export type CustomerOrderDeposit = {
  id: string
  customerOrderId: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  notes: string | null
}

export type CustomerOrderRefund = {
  id: string
  customerOrderId: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  notes: string | null
}

// A fulfillment event — each one creates a sales_transaction.
export type CustomerOrderFulfillment = {
  id: string
  customerOrderId: string
  saleRef: string            // the sales_transaction it generated, e.g. "S-006"
  fulfillmentDate: string
  notes: string | null
}

export type CustomerOrder = {
  id: string
  orderRef: string           // display label e.g. "CO-001"
  orderDate: string
  customerName: string | null
  status: CustomerOrderStatus
  notes: string | null
  createdByName: string
  lineItems: CustomerOrderItem[]
  deposits: CustomerOrderDeposit[]
  refunds: CustomerOrderRefund[]
  fulfillments: CustomerOrderFulfillment[]
}

// Enriched with derived totals and fulfillment progress.
export type CustomerOrderWithTotals = CustomerOrder & {
  orderTotal: number          // sum of (quantity × agreedUnitPrice)
  fulfilledValue: number      // sum of (quantityFulfilled × agreedUnitPrice)
  totalDeposited: number      // sum of deposits
  totalRefunded: number       // sum of refunds
  netDepositHeld: number      // totalDeposited − totalRefunded
  balanceRemaining: number    // orderTotal − netDepositHeld
  fulfillmentPercent: number  // 0–100, by quantity across all lines
}
