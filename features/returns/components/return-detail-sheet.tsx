'use client'

import { User, ArrowLeftRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { formatCurrency, formatStock } from '@utils/format'
import type { PaymentMethod, SaleReturnWithTotals } from '../types'

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash', transfer: 'Transfer', other: 'Other',
}

interface ReturnDetailSheetProps {
  saleReturn: SaleReturnWithTotals | null
  open: boolean
  onClose: () => void
  isOwner: boolean
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-medium text-foreground mb-2">{children}</h3>
}

function SummaryRow({
  label,
  value,
  bold,
  muted,
  highlight,
}: {
  label: string
  value: string
  bold?: boolean
  muted?: boolean
  highlight?: 'positive' | 'destructive'
}) {
  const valueClass =
    highlight === 'destructive' ? 'text-destructive'
    : highlight === 'positive' ? 'text-emerald-600'
    : muted ? 'text-muted-foreground'
    : 'text-foreground'

  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 ${bold ? 'font-medium' : ''}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs ${valueClass} ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  )
}

export function ReturnDetailSheet({ saleReturn, open, onClose, isOwner }: ReturnDetailSheetProps) {
  if (!saleReturn) return null

  const refundStatus =
    saleReturn.refundOutstanding <= 0 ? 'settled'
    : saleReturn.totalRefunded === 0 ? 'pending'
    : 'partial'

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col overflow-y-auto">

        {/* Header */}
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between pr-8">
            <div>
              <SheetTitle>{saleReturn.returnRef}</SheetTitle>
              <SheetDescription>
                {new Date(saleReturn.returnDate).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </SheetDescription>
            </div>
            <Badge variant={
              refundStatus === 'settled' ? 'default'
              : refundStatus === 'pending' ? 'destructive'
              : 'secondary'
            }>
              {refundStatus === 'settled' ? 'Refunded' : refundStatus === 'pending' ? 'Refund Pending' : 'Partial Refund'}
            </Badge>
          </div>

          {/* Original sale link */}
          <div className="flex items-center gap-1.5 mt-2 rounded-md bg-muted/40 px-3 py-2 text-xs">
            <ArrowLeftRight className="size-3 text-muted-foreground" />
            <span className="text-muted-foreground">Return against sale</span>
            {/* TODO: link to original sale detail */}
            <span className="font-medium text-foreground">{saleReturn.originalSaleRef}</span>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {saleReturn.customerName ?? 'Walk-in customer'}
            </span>
            <span>·</span>
            <span>Recorded by {saleReturn.createdByName}</span>
          </div>

          {saleReturn.reason && (
            <div className="mt-2">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Reason</span>
              <p className="text-xs text-foreground leading-relaxed">{saleReturn.reason}</p>
            </div>
          )}
          {saleReturn.notes && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{saleReturn.notes}</p>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6 flex-1">

          {/* Returned Items */}
          <section>
            <SectionHeader>
              Items Returned
              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                ({saleReturn.lineItems.length} line{saleReturn.lineItems.length !== 1 ? 's' : ''})
              </span>
            </SectionHeader>
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Item</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Returned</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Refund/Unit</th>
                    {isOwner && (
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Cost Restored</th>
                    )}
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {saleReturn.lineItems.map(li => {
                    const lineRefund = li.quantityReturned * li.unitPriceRefunded
                    const lineCost   = li.quantityReturned * li.unitCostFifo
                    return (
                      <tr key={li.id} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-2">
                          <div className="font-medium text-foreground">{li.item.name}</div>
                          {li.item.brand && (
                            <div className="text-[10px] text-muted-foreground">{li.item.brand}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="text-foreground">
                            {formatStock(li.quantityReturned)} {li.item.saleUnitAbbreviation}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            of {formatStock(li.quantitySold)} sold
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">
                          {formatCurrency(li.unitPriceRefunded)}
                        </td>
                        {isOwner && (
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {formatCurrency(lineCost)}
                          </td>
                        )}
                        <td className="px-3 py-2 text-right font-medium text-foreground">
                          {formatCurrency(lineRefund)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
              Returned stock is restored to its original FIFO batches.
            </p>
          </section>

          {/* Summary */}
          <section>
            <SectionHeader>Summary</SectionHeader>
            <div className="rounded-lg border border-border/60 px-3 py-1">
              <SummaryRow label="Total refund due" value={formatCurrency(saleReturn.totalRefund)} />
              {isOwner && (
                <SummaryRow label="Cost restored to stock" value={formatCurrency(saleReturn.totalCostRestored)} muted />
              )}
              <SummaryRow label="Refunded so far" value={formatCurrency(saleReturn.totalRefunded)} />
              <SummaryRow
                label="Outstanding refund"
                value={saleReturn.refundOutstanding > 0 ? formatCurrency(saleReturn.refundOutstanding) : 'Settled'}
                bold
                highlight={saleReturn.refundOutstanding > 0 ? 'destructive' : undefined}
              />
            </div>
          </section>

          {/* Refund Payments */}
          <section>
            <SectionHeader>
              Refund Payments
              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                ({saleReturn.payments.length})
              </span>
            </SectionHeader>
            {saleReturn.payments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center rounded-lg border border-border/60">
                No refund paid out yet
              </p>
            ) : (
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Method</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleReturn.payments.map(p => (
                      <tr key={p.id} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-2 text-foreground">
                          {new Date(p.paymentDate).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {PAYMENT_METHOD_LABELS[p.paymentMethod]}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-foreground">
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </SheetContent>
    </Sheet>
  )
}
