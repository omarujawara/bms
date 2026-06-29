'use client'

import { formatCurrency } from '@utils/format'
import type { MonthlyRevenuePoint } from '../types'

interface RevenueChartProps {
  data: MonthlyRevenuePoint[]
  isOwner: boolean
}

// Lightweight bar chart built with divs — no charting dependency.
export function RevenueChart({ data, isOwner }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-medium text-foreground">Revenue Trend</h2>
          <p className="text-[10px] text-muted-foreground">Last 6 months</p>
        </div>
        <div className="flex items-center gap-3">
          <Legend swatch="bg-primary" label="Revenue" />
          {isOwner && <Legend swatch="bg-emerald-500" label="Profit" />}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 h-40">
        {data.map(point => {
          const revPct    = (point.revenue / maxRevenue) * 100
          const profitPct = (point.profit / maxRevenue) * 100
          const margin    = point.revenue > 0 ? Math.round((point.profit / point.revenue) * 100) : 0

          return (
            <div key={point.month} className="group flex flex-1 flex-col items-center gap-1.5">
              {/* Bars */}
              <div className="relative flex w-full flex-1 items-end justify-center">
                {/* Tooltip */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="rounded-md bg-popover border border-border px-2 py-1 shadow-md whitespace-nowrap">
                    <div className="text-[10px] text-foreground">{formatCurrency(point.revenue)}</div>
                    {isOwner && (
                      <div className="text-[10px] text-emerald-600">
                        {formatCurrency(point.profit)} · {margin}%
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex w-full items-end justify-center gap-0.5">
                  {/* Revenue bar */}
                  <div
                    className="w-full max-w-7 rounded-t bg-primary/80 group-hover:bg-primary transition-colors"
                    style={{ height: `${revPct}%` }}
                  />
                  {/* Profit bar — owner only */}
                  {isOwner && (
                    <div
                      className="w-full max-w-7 rounded-t bg-emerald-500/80 group-hover:bg-emerald-500 transition-colors"
                      style={{ height: `${profitPct}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Month label */}
              <span className="text-[10px] text-muted-foreground">{point.month}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span className={`size-2 rounded-sm ${swatch}`} />
      {label}
    </span>
  )
}
