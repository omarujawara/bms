import type {
  ActivityItem,
  DashboardAlert,
  DashboardMetrics,
  MonthlyRevenuePoint,
} from './types'

function hoursAgo(hours: number): string {
  const d = new Date()
  d.setHours(d.getHours() - hours)
  return d.toISOString()
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const periodLabel = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

// ─── Headline metrics (month to date) ─────────────────────────

export const MOCK_METRICS: DashboardMetrics = {
  periodLabel,
  revenue: 1_284_500,
  salesCount: 42,
  outstandingReceivables: 186_300,   // unpaid sales (e.g. S-004) + CO balances
  cost: 868_000,
  profit: 416_500,
  expenses: 124_900,
  inventoryValue: 3_142_000,
}

// ─── Operational alerts (coherent with the domain mock data) ──

export const MOCK_ALERTS: DashboardAlert[] = [
  { key: 'low-stock',       label: 'Low stock items',        count: 3, href: '/inventory',          tone: 'warning', ownerOnly: false },
  { key: 'overdue-rentals', label: 'Overdue rentals',        count: 1, href: '/rentals',            tone: 'danger',  ownerOnly: false },
  { key: 'pending-delivery',label: 'Awaiting delivery',      count: 2, href: '/purchasing',         tone: 'neutral', ownerOnly: true  },
  { key: 'open-orders',     label: 'Open customer orders',   count: 2, href: '/orders',             tone: 'neutral', ownerOnly: false },
  { key: 'refunds-pending', label: 'Refunds pending',        count: 1, href: '/returns',            tone: 'warning', ownerOnly: false },
  { key: 'payroll-adj',     label: 'Pending payroll adjustments', count: 2, href: '/payroll',       tone: 'warning', ownerOnly: true  },
]

// ─── Revenue trend (last 6 months, including current) ─────────

export const MOCK_REVENUE_TREND: MonthlyRevenuePoint[] = [
  { month: 'Jan', revenue: 1_010_000, profit: 318_000 },
  { month: 'Feb', revenue: 1_142_000, profit: 360_000 },
  { month: 'Mar', revenue: 980_000,  profit: 295_000 },
  { month: 'Apr', revenue: 1_233_000, profit: 392_000 },
  { month: 'May', revenue: 1_318_000, profit: 421_000 },
  { month: 'Jun', revenue: 1_284_500, profit: 416_500 },
]

// ─── Recent activity (cross-domain feed) ──────────────────────

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'act-1', type: 'sale', ref: 'S-001',
    title: 'Sale to Modou Construction', subtitle: '2 items · cement, steel',
    amount: 114_000, amountTone: 'in', ownerOnly: false,
    timestamp: hoursAgo(2), staffName: 'Awa Sanneh',
  },
  {
    id: 'act-2', type: 'return', ref: 'R-003',
    title: 'Return from Modou Construction', subtitle: 'Steel rods · refund pending',
    amount: 21_000, amountTone: 'out', ownerOnly: false,
    timestamp: hoursAgo(4), staffName: 'Awa Sanneh',
  },
  {
    id: 'act-3', type: 'sale', ref: 'S-002',
    title: 'Walk-in sale', subtitle: 'Hollow blocks ×50',
    amount: 20_000, amountTone: 'in', ownerOnly: false,
    timestamp: hoursAgo(6), staffName: 'Awa Sanneh',
  },
  {
    id: 'act-4', type: 'adjustment', ref: 'ADJ-001',
    title: 'Stock adjustment · damaged', subtitle: 'Hollow Block 6" ×35',
    amount: null, amountTone: 'neutral', ownerOnly: false,
    timestamp: hoursAgo(20), staffName: 'Lamin Touray',
  },
  {
    id: 'act-5', type: 'rental', ref: 'RN-005',
    title: 'New rental · Plate Compactor', subtitle: 'Mariama Bah · 7 days',
    amount: 1_500, amountTone: 'in', ownerOnly: false,
    timestamp: daysAgo(1), staffName: 'Awa Sanneh',
  },
  {
    id: 'act-6', type: 'expense', ref: 'EXP-001',
    title: 'Expense · Transport', subtitle: 'Truck fuel for site deliveries',
    amount: 12_000, amountTone: 'out', ownerOnly: true,
    timestamp: daysAgo(1), staffName: 'Awa Sanneh',
  },
  {
    id: 'act-7', type: 'order', ref: 'CO-001',
    title: 'Customer order · Banjul Builders', subtitle: 'Deposit D150,000 received',
    amount: 150_000, amountTone: 'in', ownerOnly: false,
    timestamp: daysAgo(2), staffName: 'Awa Sanneh',
  },
  {
    id: 'act-8', type: 'assembly', ref: 'AS-003',
    title: 'Assembly run · Premixed Mortar', subtitle: '50 bags produced',
    amount: null, amountTone: 'neutral', ownerOnly: false,
    timestamp: daysAgo(4), staffName: 'Lamin Touray',
  },
  {
    id: 'act-9', type: 'purchase', ref: 'PO-004',
    title: 'Stock received · PO-004', subtitle: 'Gravel + sand',
    amount: 224_000, amountTone: 'out', ownerOnly: true,
    timestamp: daysAgo(5), staffName: 'Awa Sanneh',
  },
]
