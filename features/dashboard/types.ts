// The dashboard consumes PRE-AGGREGATED metrics. In production these come from
// summary queries / RPCs in the dashboard db/ layer — not from raw domain rows.
// This keeps the dashboard decoupled from every other feature's internals.

export type DashboardMetrics = {
  periodLabel: string          // e.g. "June 2026"

  // Revenue side — visible to all roles
  revenue: number
  salesCount: number
  outstandingReceivables: number  // unpaid sales + customer-order balances

  // Cost/profit side — OWNER ONLY
  cost: number
  profit: number
  expenses: number
  inventoryValue: number
}

export type DashboardAlert = {
  key: string
  label: string
  count: number
  href: string                 // destination route
  tone: 'warning' | 'danger' | 'neutral'
  ownerOnly: boolean
}

export type MonthlyRevenuePoint = {
  month: string                // short label e.g. "Jan"
  revenue: number
  profit: number               // owner-only overlay
}

export type ActivityType =
  | 'sale'
  | 'return'
  | 'purchase'
  | 'order'
  | 'rental'
  | 'assembly'
  | 'expense'
  | 'adjustment'

export type ActivityItem = {
  id: string
  type: ActivityType
  ref: string
  title: string
  subtitle: string
  amount: number | null
  amountTone: 'in' | 'out' | 'neutral'  // money in, money out, or non-financial
  ownerOnly: boolean           // hide cost-revealing rows (e.g. expenses) from reps
  timestamp: string
  staffName: string
}
