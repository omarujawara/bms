'use client'

import { CheckCircle2, Circle, MinusCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { formatCurrency } from '@utils/format'
import type { PaymentMethod, PurchaseOrderStatus, PurchaseOrderWithTotals } from '../types'

const STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending_delivery:   { label: 'Pending Delivery', variant: 'outline' },
  partially_received: { label: 'Partially Received', variant: 'secondary' },
  received:           { label: 'Received',          variant: 'default' },
  cancelled:          { label: 'Cancelled',         variant: 'destructive' },
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash', transfer: 'Transfer', other: 'Other',
}

interface PurchaseOrderSheetProps {
  order: PurchaseOrderWithTotals | null
  open: boolean
  onClose: () => void
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium text-foreground mb-2">{children}</h3>
  )
}

function SummaryRow({
  label,
  value,
  bold,
  highlight,
}: {
  label: string
  value: string
  bold?: boolean
  highlight?: 'positive' | 'destructive'
}) {
  const valueClass = highlight === 'destructive'
    ? 'text-destructive'
    : highlight === 'positive'
    ? 'text-foreground'
    : 'text-foreground'

  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 ${bold ? 'font-medium' : ''}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs ${valueClass} ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  )
}

function ReceivingIcon({ ordered, received }: { ordered: number; received: number }) {
  if (received === 0) return <Circle className="size-3.5 text-muted-foreground/50 shrink-0" />
  if (received >= ordered) return <CheckCircle2 className="size-3.5 text-primary shrink-0" />
  return <MinusCircle className="size-3.5 text-amber-500 shrink-0" />
}

export function PurchaseOrderSheet({ order, open, onClose }: PurchaseOrderSheetProps) {
  if (!order) return null

  const { label: statusLabel, variant: statusVariant } = STATUS_CONFIG[order.status]

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col overflow-y-auto">

        {/* Header */}
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between pr-8">
            <div>
              <SheetTitle>{order.orderRef}</SheetTitle>
              <SheetDescription>
                {new Date(order.orderDate).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </SheetDescription>
            </div>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          {order.notes && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{order.notes}</p>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6 flex-1">

          {/* Line Items */}
          <section>
            <SectionHeader>
              Items Ordered
              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                ({order.lineItems.length} line{order.lineItems.length !== 1 ? 's' : ''})
              </span>
            </SectionHeader>
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Item</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Ordered</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Received</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Unit Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lineItems.map(li => (
                    <tr key={li.id} className="border-b border-border/40 last:border-0">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <ReceivingIcon
                            ordered={li.quantityOrdered}
                            received={li.quantityReceived}
                          />
                          <div>
                            <div className="font-medium text-foreground">{li.item.name}</div>
                            {li.item.brand && (
                              <div className="text-[10px] text-muted-foreground">{li.item.brand}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {li.quantityOrdered} {li.item.purchaseUnitAbbreviation}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={
                          li.quantityReceived === 0
                            ? 'text-muted-foreground'
                            : li.quantityReceived < li.quantityOrdered
                            ? 'text-amber-600 font-medium'
                            : 'text-foreground'
                        }>
                          {li.quantityReceived} {li.item.purchaseUnitAbbreviation}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-foreground">
                        {formatCurrency(li.unitCost)}/{li.item.purchaseUnitAbbreviation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Financial Summary */}
          <section>
            <SectionHeader>Financials</SectionHeader>
            <div className="rounded-lg border border-border/60 px-3 py-1">
              <SummaryRow label="Order total" value={formatCurrency(order.totalCost)} />
              <SummaryRow label="Amount paid" value={formatCurrency(order.totalPaid)} />
              <SummaryRow
                label="Balance due"
                value={order.balanceDue > 0 ? formatCurrency(order.balanceDue) : 'Fully paid'}
                bold
                highlight={order.balanceDue > 0 ? 'destructive' : undefined}
              />
            </div>
          </section>

          {/* Payments */}
          <section>
            <SectionHeader>
              Payments
              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                ({order.payments.length})
              </span>
            </SectionHeader>

            {order.payments.length === 0 ? (
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
                    {order.payments.map(p => (
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
                {order.payments[0]?.notes && (
                  <div className="px-3 py-2 border-t border-border/40 text-[10px] text-muted-foreground">
                    {order.payments[0].notes}
                  </div>
                )}
              </div>
            )}
          </section>

        </div>
      </SheetContent>
    </Sheet>
  )
}
