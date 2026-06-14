'use client'

import { TrendingUp, TrendingDown, Wallet, Receipt, Boxes, ArrowDownRight } from 'lucide-react'

import { formatCurrency } from '@utils/format'
import { RevenueChart } from './revenue-chart'
import { AlertsPanel } from './alerts-panel'
import { ActivityFeed } from './activity-feed'
import type {
  ActivityItem,
  DashboardAlert,
  DashboardMetrics,
  MonthlyRevenuePoint,
} from '../types'

// TODO: replace with session user (role + name) once auth is wired
const CURRENT_ROLE: 'owner' | 'sales_rep' = 'owner'
const CURRENT_USER_NAME = 'Omaru'

interface DashboardOverviewProps {
  metrics: DashboardMetrics
  alerts: DashboardAlert[]
  revenueTrend: MonthlyRevenuePoint[]
  activity: ActivityItem[]
}

export function DashboardOverview({
  metrics,
  alerts,
  revenueTrend,
  activity,
}: DashboardOverviewProps) {
  const isOwner = CURRENT_ROLE === 'owner'
  const margin = metrics.revenue > 0 ? Math.round((metrics.profit / metrics.revenue) * 100) : 0

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="flex flex-col gap-5">

      {/* Greeting header */}
      <div>
        <h1 className="text-sm font-semibold text-foreground">
          {greeting}, {CURRENT_USER_NAME}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Here&apos;s what&apos;s happening · {metrics.periodLabel}
        </p>
      </div>

      {/* KPI cards */}
      <div className={`grid gap-3 ${isOwner ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
        <KpiCard
          label="Revenue"
          value={formatCurrency(metrics.revenue)}
          icon={<Receipt className="size-3.5 text-muted-foreground" />}
          sub={`${metrics.salesCount} sales`}
        />
        {isOwner && (
          <KpiCard
            label="Profit"
            value={formatCurrency(metrics.profit)}
            icon={<TrendingUp className="size-3.5 text-emerald-600" />}
            sub={`${margin}% margin`}
            valueClass="text-emerald-600"
          />
        )}
        <KpiCard
          label="Receivables"
          value={formatCurrency(metrics.outstandingReceivables)}
          icon={<ArrowDownRight className="size-3.5 text-muted-foreground" />}
          sub="outstanding"
          valueClass={metrics.outstandingReceivables > 0 ? 'text-destructive' : undefined}
        />
        {isOwner ? (
          <KpiCard
            label="Expenses"
            value={formatCurrency(metrics.expenses)}
            icon={<TrendingDown className="size-3.5 text-muted-foreground" />}
            sub="this month"
          />
        ) : (
          <KpiCard
            label="Inventory"
            value={`${metrics.salesCount}`}
            icon={<Boxes className="size-3.5 text-muted-foreground" />}
            sub="sales this month"
          />
        )}
      </div>

      {/* Owner-only secondary metric strip */}
      {isOwner && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <MiniMetric label="Cost of goods sold" value={formatCurrency(metrics.cost)} icon={<Wallet className="size-3.5 text-muted-foreground" />} />
          <MiniMetric label="Inventory value" value={formatCurrency(metrics.inventoryValue)} icon={<Boxes className="size-3.5 text-muted-foreground" />} />
          <MiniMetric label="Gross margin" value={`${margin}%`} icon={<TrendingUp className="size-3.5 text-emerald-600" />} />
        </div>
      )}

      {/* Main grid: chart + alerts */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueTrend} isOwner={isOwner} />
        </div>
        <div>
          <AlertsPanel alerts={alerts} isOwner={isOwner} />
        </div>
      </div>

      {/* Activity feed */}
      <ActivityFeed activity={activity} isOwner={isOwner} />

    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
  sub,
  valueClass,
}: {
  label: string
  value: string
  icon: React.ReactNode
  sub?: string
  valueClass?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <span className={`text-xl font-semibold leading-none ${valueClass ?? 'text-foreground'}`}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  )
}

function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5">
      {icon}
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-foreground">{value}</span>
      </div>
    </div>
  )
}
