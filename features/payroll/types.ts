export type PayrollAdjustmentReason = 'sale_return' | 'correction' | 'other'

export type StaffRef = {
  id: string
  fullName: string
}

export type PayrollAdjustment = {
  id: string
  staff: StaffRef
  originatingPeriodRef: string      // the period the adjustment came from
  absorbingPeriodRef: string | null // period that absorbs it; null = PENDING
  adjustmentAmount: number          // signed; negative = deduction (clawback)
  reason: PayrollAdjustmentReason
  saleReturnRef: string | null      // set when reason = 'sale_return'
  notes: string | null
  createdAt: string
}

export type PayrollPeriod = {
  id: string
  periodRef: string                 // display label e.g. "PP-001"
  staff: StaffRef
  periodStart: string
  periodEnd: string
  grossProfit: number               // profit attributed to this staff for the window
  percentage: number                // commission rate, 0–1
  amountPaid: number                // actual amount paid out
  paymentDate: string
  notes: string | null
}

// Enriched with derived commission math and the adjustments linked to it.
export type PayrollPeriodWithDetail = PayrollPeriod & {
  baseCommission: number            // grossProfit × percentage
  absorbedAdjustments: PayrollAdjustment[]  // adjustments this period absorbed
  absorbedTotal: number             // sum of absorbed adjustment amounts (signed)
  netDue: number                    // baseCommission + absorbedTotal
  variance: number                  // amountPaid − netDue (rounding / discretionary)
}
