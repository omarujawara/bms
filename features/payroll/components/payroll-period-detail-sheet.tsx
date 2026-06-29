'use client'

import { User, CalendarRange } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { formatCurrency } from '@utils/format'
import type { PayrollAdjustmentReason, PayrollPeriodWithDetail } from '../types'

const REASON_LABELS: Record<PayrollAdjustmentReason, string> = {
  sale_return: 'Sale return',
  correction: 'Correction',
  other: 'Other',
}

interface PayrollPeriodDetailSheetProps {
  period: PayrollPeriodWithDetail | null
  open: boolean
  onClose: () => void
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-medium text-foreground mb-2">{children}</h3>
}

function CalcRow({
  label,
  value,
  bold,
  signed,
}: {
  label: React.ReactNode
  value: string
  bold?: boolean
  signed?: 'positive' | 'negative'
}) {
  const valueClass =
    signed === 'negative' ? 'text-destructive'
    : signed === 'positive' ? 'text-emerald-600'
    : 'text-foreground'
  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 ${bold ? 'font-medium' : ''}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs ${valueClass} ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function PayrollPeriodDetailSheet({ period, open, onClose }: PayrollPeriodDetailSheetProps) {
  if (!period) return null

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-md w-full flex flex-col overflow-y-auto">

        {/* Header */}
        <SheetHeader className="border-b border-border pb-4">
          <div className="pr-8">
            <SheetTitle>{period.periodRef}</SheetTitle>
            <SheetDescription className="flex items-center gap-1">
              <User className="size-3" />
              {period.staff.fullName}
            </SheetDescription>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <CalendarRange className="size-3" />
            {formatDate(period.periodStart)} — {formatDate(period.periodEnd)}
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6 flex-1">

          {/* Commission calculation */}
          <section>
            <SectionHeader>Commission</SectionHeader>
            <div className="rounded-lg border border-border/60 px-3 py-1">
              <CalcRow label="Gross profit" value={formatCurrency(period.grossProfit)} />
              <CalcRow label={`Commission rate`} value={`${(period.percentage * 100).toFixed(1)}%`} />
              <CalcRow label="Base commission" value={formatCurrency(period.baseCommission)} bold />
            </div>
          </section>

          {/* Adjustments absorbed by this period */}
          <section>
            <SectionHeader>
              Adjustments Absorbed
              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                ({period.absorbedAdjustments.length})
              </span>
            </SectionHeader>
            {period.absorbedAdjustments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center rounded-lg border border-border/60">
                None
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {period.absorbedAdjustments.map(a => (
                  <div key={a.id} className="rounded-lg border border-border/60 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">
                        {REASON_LABELS[a.reason]}
                        {a.saleReturnRef && (
                          <span className="text-muted-foreground font-normal"> · {a.saleReturnRef}</span>
                        )}
                      </span>
                      <span className={`text-xs font-semibold ${a.adjustmentAmount < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                        {a.adjustmentAmount < 0 ? '−' : '+'} {formatCurrency(Math.abs(a.adjustmentAmount))}
                      </span>
                    </div>
                    {a.notes && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{a.notes}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Originated from {a.originatingPeriodRef}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pay reconciliation */}
          <section>
            <SectionHeader>Payment</SectionHeader>
            <div className="rounded-lg border border-border/60 px-3 py-1">
              <CalcRow label="Base commission" value={formatCurrency(period.baseCommission)} />
              {period.absorbedTotal !== 0 && (
                <CalcRow
                  label="Adjustments"
                  value={`${period.absorbedTotal < 0 ? '−' : '+'} ${formatCurrency(Math.abs(period.absorbedTotal))}`}
                  signed={period.absorbedTotal < 0 ? 'negative' : 'positive'}
                />
              )}
              <CalcRow label="Net due" value={formatCurrency(period.netDue)} bold />
              <CalcRow label="Amount paid" value={formatCurrency(period.amountPaid)} />
              {Math.abs(period.variance) > 0.005 && (
                <CalcRow
                  label="Variance"
                  value={`${period.variance < 0 ? '−' : '+'} ${formatCurrency(Math.abs(period.variance))}`}
                  signed={period.variance < 0 ? 'negative' : 'positive'}
                />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
              Paid {formatDate(period.paymentDate)}.
            </p>
          </section>

          {period.notes && (
            <section>
              <SectionHeader>Notes</SectionHeader>
              <p className="text-xs text-muted-foreground leading-relaxed rounded-lg border border-border/60 px-3 py-2">
                {period.notes}
              </p>
            </section>
          )}

        </div>
      </SheetContent>
    </Sheet>
  )
}
