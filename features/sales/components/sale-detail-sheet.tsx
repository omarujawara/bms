'use client'

import { User, Pencil } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { formatCurrency } from '@utils/format'
import type { PaymentMethod, SalesTransactionWithTotals } from '../types'

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash', transfer: 'Transfer', other: 'Other',
}

interface SaleDetailSheetProps {
  sale: SalesTransactionWithTotals | null
  open: boolean
  onClose: () => void
  isOwner: boolean
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-medium text-foreground mb-2">{children}</h3>
}

export function SaleDetailSheet({ sale, open, onClose, isOwner }: SaleDetailSheetProps) {
  if (!sale) return null

  const paymentStatus =
    sale.balanceDue <= 0 ? 'paid'
    : sale.totalPaid === 0 ? 'unpaid'
    : 'partial'

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col overflow-y-auto">

        {/* Header */}
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between pr-8">
            <div>
              <SheetTitle>{sale.saleRef}</SheetTitle>
              <SheetDescription>
                {new Date(sale.transactionDate).toLocaleString('en-GB', {
                  day: '2-digit', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </SheetDescription>
            </div>
            <Badge variant={
              paymentStatus === 'paid' ? 'default'
              : paymentStatus === 'unpaid' ? 'destructive'
              : 'secondary'
            }>
              {paymentStatus === 'paid' ? 'Paid' : paymentStatus === 'unpaid' ? 'Unpaid' : 'Partial'}
            </Badge>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {sale.customerName ?? 'Walk-in customer'}
            </span>
            <span>·</span>
            <span>Recorded by {sale.createdByName}</span>
          </div>

          {sale.notes && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{sale.notes}</p>
          )}

          {/* Same-day edit affordance */}
          {sale.isEditable && (
            <div className="flex items-center justify-between mt-3 rounded-md bg-muted/40 px-3 py-2">
              <span className="text-[10px] text-muted-foreground">
                Same-day sale — editable until end of day
              </span>
              {/* TODO: open edit form */}
              <Button variant="outline" size="xs">
                <Pencil />
                Edit
              </Button>
            </div>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6 flex-1">

          {/* Line Items */}
          <section>
            <SectionHeader>
              Items Sold
              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                ({sale.lineItems.length} line{sale.lineItems.length !== 1 ? 's' : ''})
              </span>
            </SectionHeader>
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Item</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Qty</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Unit Price</th>
                    {isOwner && (
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Profit</th>
                    )}
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.lineItems.map(li => {
                    const lineTotal  = li.quantity * li.unitPrice
                    const lineProfit = li.quantity * (li.unitPrice - li.unitCostFifo)
                    return (
                      <tr key={li.id} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-2">
                          <div className="font-medium text-foreground">{li.item.name}</div>
                          {li.item.brand && (
                            <div className="text-[10px] text-muted-foreground">{li.item.brand}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {li.quantity} {li.item.saleUnitAbbreviation}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">
                          {formatCurrency(li.unitPrice)}
                        </td>
                        {isOwner && (
                          <td className="px-3 py-2 text-right text-emerald-600">
                            {formatCurrency(lineProfit)}
                          </td>
                        )}
                        <td className="px-3 py-2 text-right font-medium text-foreground">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Financial Summary */}
          <section>
            <SectionHeader>Summary</SectionHeader>
            <div className="rounded-lg border border-border/60 px-3 py-1">
              <SummaryRow label="Revenue" value={formatCurrency(sale.totalRevenue)} />
              {isOwner && (
                <>
                  <SummaryRow label="Cost (FIFO)" value={formatCurrency(sale.totalCost)} muted />
                  <SummaryRow label="Profit" value={formatCurrency(sale.totalProfit)} highlight="positive" />
                </>
              )}
              <SummaryRow label="Paid" value={formatCurrency(sale.totalPaid)} />
              <SummaryRow
                label="Balance due"
                value={sale.balanceDue > 0 ? formatCurrency(sale.balanceDue) : 'Settled'}
                bold
                highlight={sale.balanceDue > 0 ? 'destructive' : undefined}
              />
            </div>
            {isOwner && (
              <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                Cost and profit are visible to owners only.
              </p>
            )}
          </section>

          {/* Payments */}
          <section>
            <SectionHeader>
              Payments
              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                ({sale.payments.length})
              </span>
            </SectionHeader>
            {sale.payments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center rounded-lg border border-border/60">
                No payments recorded
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
                    {sale.payments.map(p => (
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
