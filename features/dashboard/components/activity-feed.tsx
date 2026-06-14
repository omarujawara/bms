'use client'

import {
  Receipt, Undo2, Truck, ClipboardList, Boxes, Hammer, Wallet, PackageMinus,
} from 'lucide-react'

import { formatCurrency } from '@utils/format'
import type { ActivityItem, ActivityType } from '../types'

const TYPE_ICON: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  sale:       Receipt,
  return:     Undo2,
  purchase:   Truck,
  order:      ClipboardList,
  rental:     Boxes,
  assembly:   Hammer,
  expense:    Wallet,
  adjustment: PackageMinus,
}

interface ActivityFeedProps {
  activity: ActivityItem[]
  isOwner: boolean
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins  = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function ActivityFeed({ activity, isOwner }: ActivityFeedProps) {
  // Drop owner-only rows (e.g. expenses, purchase costs) for reps.
  const visible = activity.filter(a => isOwner || !a.ownerOnly)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-xs font-medium text-foreground mb-3">Recent Activity</h2>

      <div className="flex flex-col">
        {visible.map((a, i) => {
          const Icon = TYPE_ICON[a.type]
          const amountClass =
            a.amountTone === 'in' ? 'text-emerald-600'
            : a.amountTone === 'out' ? 'text-destructive'
            : 'text-muted-foreground'

          return (
            <div
              key={a.id}
              className={`flex items-start gap-3 py-2.5 ${i !== visible.length - 1 ? 'border-b border-border/40' : ''}`}
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-muted shrink-0 mt-0.5">
                <Icon className="size-3.5 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-foreground truncate">{a.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{a.ref}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{a.subtitle}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {a.staffName} · {relativeTime(a.timestamp)}
                </p>
              </div>

              {a.amount !== null && (
                <span className={`text-xs font-semibold shrink-0 ${amountClass}`}>
                  {a.amountTone === 'out' ? '−' : a.amountTone === 'in' ? '+' : ''}
                  {formatCurrency(a.amount)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
