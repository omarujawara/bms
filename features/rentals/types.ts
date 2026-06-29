export type PaymentMethod = 'cash' | 'transfer' | 'other'

export type RentalRateType = 'daily' | 'weekly'

// Stored status. 'overdue' is intentionally NOT a status — it is derived
// (status = 'active' AND expected_return_date < today).
export type RentalStatus = 'active' | 'returned'

export type RentalPayment = {
  id: string
  rentalId: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  notes: string | null
}

export type Rental = {
  id: string
  rentalRef: string          // display label e.g. "RN-001"
  customer: {
    id: string
    fullName: string
    contactNumber: string
    idImageUrl: string | null
  }
  item: {
    id: string
    name: string
    categoryName: string
  }
  startDate: string
  expectedReturnDate: string
  actualReturnDate: string | null
  rateType: RentalRateType
  rateSnapshot: number        // rate locked at rental creation
  status: RentalStatus
  notes: string | null
  createdByName: string
  payments: RentalPayment[]
}

// Enriched with derived fields. None of these are stored — they are
// computed at query/render time.
export type RentalWithDerived = Rental & {
  isOverdue: boolean          // active && expectedReturnDate < today
  daysOut: number             // start → (actualReturn ?? today), min 1
  estimatedCharge: number     // duration × rateSnapshot, by rateType
  totalPaid: number
  balanceDue: number          // estimatedCharge − totalPaid
}
