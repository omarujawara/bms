import type {
  PayrollAdjustment,
  PayrollPeriod,
  PayrollPeriodWithDetail,
  StaffRef,
} from './types'

// Build a calendar-month window N months before the current month.
function monthWindow(monthsAgo: number): { start: string; end: string; payDate: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
  const end   = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0) // last day of month
  // paid a few days after period end
  const pay   = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 3)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { start: iso(start), end: iso(end), payDate: iso(pay) }
}

const AWA: StaffRef   = { id: 'st-1', fullName: 'Awa Sanneh' }
const LAMIN: StaffRef = { id: 'st-2', fullName: 'Lamin Touray' }

const m3 = monthWindow(3)
const m2 = monthWindow(2)
const m1 = monthWindow(1)

// ─── Adjustments ──────────────────────────────────────────────

const ADJUSTMENTS: PayrollAdjustment[] = [
  {
    id: 'pa-001',
    staff: AWA,
    originatingPeriodRef: 'PP-003',     // arose from a return against a month-2 sale
    absorbingPeriodRef: 'PP-005',       // applied to the month-1 period
    adjustmentAmount: -3100,            // clawback: commission on returned goods
    reason: 'sale_return',
    saleReturnRef: 'R-001',
    notes: 'Commission reversed on cement returned by Fatou Jallow',
    createdAt: m2.end,
  },
  {
    id: 'pa-002',
    staff: LAMIN,
    originatingPeriodRef: 'PP-006',     // arose from a recent return
    absorbingPeriodRef: null,           // PENDING — not yet applied to a period
    adjustmentAmount: -2400,
    reason: 'sale_return',
    saleReturnRef: 'R-003',
    notes: 'Clawback for steel rods returned by Modou Construction',
    createdAt: m1.end,
  },
  {
    id: 'pa-003',
    staff: AWA,
    originatingPeriodRef: 'PP-005',
    absorbingPeriodRef: null,           // PENDING — small correction owed to Awa
    adjustmentAmount: 1500,
    reason: 'correction',
    saleReturnRef: null,
    notes: 'Under-credited gross profit on two transactions',
    createdAt: m1.payDate,
  },
]

// ─── Periods ──────────────────────────────────────────────────

const RAW_PERIODS: PayrollPeriod[] = [
  {
    id: 'pp-001', periodRef: 'PP-001', staff: AWA,
    periodStart: m3.start, periodEnd: m3.end,
    grossProfit: 142000, percentage: 0.05, amountPaid: 7100,
    paymentDate: m3.payDate, notes: null,
  },
  {
    id: 'pp-002', periodRef: 'PP-002', staff: LAMIN,
    periodStart: m3.start, periodEnd: m3.end,
    grossProfit: 98000, percentage: 0.05, amountPaid: 4900,
    paymentDate: m3.payDate, notes: null,
  },
  {
    id: 'pp-003', periodRef: 'PP-003', staff: AWA,
    periodStart: m2.start, periodEnd: m2.end,
    grossProfit: 165000, percentage: 0.05, amountPaid: 8250,
    paymentDate: m2.payDate, notes: 'Strong month — large site orders',
  },
  {
    id: 'pp-004', periodRef: 'PP-004', staff: LAMIN,
    periodStart: m2.start, periodEnd: m2.end,
    grossProfit: 110000, percentage: 0.05, amountPaid: 5500,
    paymentDate: m2.payDate, notes: null,
  },
  {
    id: 'pp-005', periodRef: 'PP-005', staff: AWA,
    periodStart: m1.start, periodEnd: m1.end,
    grossProfit: 134000, percentage: 0.05, amountPaid: 3600,  // 6700 base − 3100 clawback
    paymentDate: m1.payDate, notes: 'Includes clawback from R-001',
  },
  {
    id: 'pp-006', periodRef: 'PP-006', staff: LAMIN,
    periodStart: m1.start, periodEnd: m1.end,
    grossProfit: 121000, percentage: 0.05, amountPaid: 6050,
    paymentDate: m1.payDate, notes: null,
  },
]

function buildDetail(p: PayrollPeriod): PayrollPeriodWithDetail {
  const baseCommission = p.grossProfit * p.percentage
  const absorbedAdjustments = ADJUSTMENTS.filter(a => a.absorbingPeriodRef === p.periodRef)
  const absorbedTotal = absorbedAdjustments.reduce((s, a) => s + a.adjustmentAmount, 0)
  const netDue = baseCommission + absorbedTotal
  return {
    ...p,
    baseCommission,
    absorbedAdjustments,
    absorbedTotal,
    netDue,
    variance: p.amountPaid - netDue,
  }
}

export const MOCK_PAYROLL_PERIODS: PayrollPeriodWithDetail[] = RAW_PERIODS.map(buildDetail)

// Pending adjustments = not yet absorbed into any period.
export const MOCK_PENDING_ADJUSTMENTS: PayrollAdjustment[] =
  ADJUSTMENTS.filter(a => a.absorbingPeriodRef === null)
