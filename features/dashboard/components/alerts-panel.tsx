'use client'

import Link from 'next/link'
import { ChevronRight, CircleCheck } from 'lucide-react'

import type { DashboardAlert } from '../types'

interface AlertsPanelProps {
  alerts: DashboardAlert[]
  isOwner: boolean
}

const TONE_CLASSES: Record<DashboardAlert['tone'], { dot: string; count: string }> = {
  danger:  { dot: 'bg-destructive',  count: 'text-destructive' },
  warning: { dot: 'bg-amber-500',    count: 'text-amber-600' },
  neutral: { dot: 'bg-muted-foreground/50', count: 'text-foreground' },
}

export function AlertsPanel({ alerts, isOwner }: AlertsPanelProps) {
  // Hide owner-only alerts from reps, and drop anything with a zero count.
  const visible = alerts.filter(a => (isOwner || !a.ownerOnly) && a.count > 0)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-xs font-medium text-foreground mb-3">Needs Attention</h2>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <CircleCheck className="size-8 text-emerald-500/50" />
          <p className="text-xs text-muted-foreground">All clear — nothing needs attention</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {visible.map(a => {
            const tone = TONE_CLASSES[a.tone]
            return (
              <Link
                key={a.key}
                href={a.href}
                className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors"
              >
                <span className={`size-1.5 rounded-full shrink-0 ${tone.dot}`} />
                <span className="text-xs text-foreground flex-1">{a.label}</span>
                <span className={`text-xs font-semibold tabular-nums ${tone.count}`}>{a.count}</span>
                <ChevronRight className="size-3 text-muted-foreground" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
