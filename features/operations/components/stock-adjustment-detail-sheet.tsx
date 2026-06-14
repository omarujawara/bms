'use client'

import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { formatCurrency, formatStock } from '@utils/format'
import type { StockAdjustmentReason, StockAdjustmentWithTotals } from '../types'

export const REASON_CONFIG: Record<StockAdjustmentReason, {
  label: string
  variant: 'secondary' | 'outline' | 'destructive'
}> = {
  damaged:      { label: 'Damaged',      variant: 'destructive' },
  missing:      { label: 'Missing',      variant: 'destructive' },
  internal_use: { label: 'Internal Use', variant: 'secondary' },
  given_away:   { label: 'Given Away',   variant: 'secondary' },
  correction:   { label: 'Correction',   variant: 'outline' },
}

interface StockAdjustmentDetailSheetProps {
  adjustment: StockAdjustmentWithTotals | null
  open: boolean
  onClose: () => void
  isOwner: boolean
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-medium text-foreground mb-2">{children}</h3>
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0 w-32">{label}</span>
      <span className="text-xs text-foreground text-right">{value}</span>
    </div>
  )
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function StockAdjustmentDetailSheet({ adjustment, open, onClose, isOwner }: StockAdjustmentDetailSheetProps) {
  if (!adjustment) return null

  const reason = REASON_CONFIG[adjustment.reason]

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-md w-full flex flex-col overflow-y-auto">

        {/* Header */}
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between pr-8">
            <div>
              <SheetTitle>{adjustment.adjustmentRef}</SheetTitle>
              <SheetDescription>
                {formatDateTime(adjustment.createdAt)} · by {adjustment.createdByName}
              </SheetDescription>
            </div>
            <Badge variant={reason.variant}>{reason.label}</Badge>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6 flex-1">

          {/* Adjustment details */}
          <section>
            <SectionHeader>Adjustment</SectionHeader>
            <div className="rounded-lg border border-border/60 px-3 py-1">
              <DetailRow
                label="Item"
                value={
                  <span>
                    {adjustment.item.name}
                    {adjustment.item.brand && (
                      <span className="block text-[10px] text-muted-foreground">{adjustment.item.brand}</span>
                    )}
                  </span>
                }
              />
              <DetailRow
                label="Quantity removed"
                value={
                  <span className="text-destructive font-medium">
                    − {formatStock(adjustment.quantity)} {adjustment.item.baseUnitAbbreviation}
                  </span>
                }
              />
              <DetailRow label="Reason" value={reason.label} />
              {isOwner && (
                <DetailRow label="Unit cost (FIFO)" value={formatCurrency(adjustment.unitCostFifo)} />
              )}
              {isOwner && (
                <DetailRow
                  label="Total cost"
                  value={<span className="font-semibold">{formatCurrency(adjustment.totalCost)}</span>}
                />
              )}
            </div>
            {isOwner && (
              <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                Cost is the FIFO value of the stock removed — owner only.
              </p>
            )}
          </section>

          {/* Batch allocations — owner only */}
          {isOwner && (
            <section>
              <SectionHeader>
                Batch Allocation
                <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(owner only)</span>
              </SectionHeader>
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Batch</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjustment.allocations.map(a => (
                      <tr key={a.id} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{a.batchId}</td>
                        <td className="px-3 py-2 text-right text-foreground">
                          {formatStock(a.quantity)} {adjustment.item.baseUnitAbbreviation}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">{formatCurrency(a.unitCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                Stock is drawn from the oldest batches first (FIFO).
              </p>
            </section>
          )}

          {adjustment.notes && (
            <section>
              <SectionHeader>Notes</SectionHeader>
              <p className="text-xs text-muted-foreground leading-relaxed rounded-lg border border-border/60 px-3 py-2">
                {adjustment.notes}
              </p>
            </section>
          )}

        </div>
      </SheetContent>
    </Sheet>
  )
}
