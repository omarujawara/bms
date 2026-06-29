'use client'

import { User, PackageCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { formatCurrency, formatStock } from '@utils/format'
import type { CustomerOrderStatus, PaymentMethod, CustomerOrderWithTotals } from '../types'

const STATUS_CONFIG: Record<CustomerOrderStatus, {
  label: string
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
}> = {
  pending:             { label: 'Pending',             variant: 'outline' },
  partially_fulfilled: { label: 'Partially Fulfilled', variant: 'secondary' },
  fulfilled:           { label: 'Fulfilled',           variant: 'default' },
  cancelled:           { label: 'Cancelled',           variant: 'destructive' },
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash', transfer: 'Transfer', other: 'Other',
}

interface CustomerOrderSheetProps {
  order: CustomerOrderWithTotals | null
  open: boolean
  onClose: () => void
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-medium text-foreground mb-2">{children}</h3>
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
  const valueClass =
    highlight === 'destructive' ? 'text-destructive'
    : highlight === 'positive' ? 'text-emerald-600'
    : 'text-foreground'
  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 ${bold ? 'font-medium' : ''}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs ${valueClass} ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  )
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full ${percent >= 100 ? 'bg-primary' : 'bg-amber-500'}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function CustomerOrderSheet({ order, open, onClose }: CustomerOrderSheetProps) {
  if (!order) return null

  const { label: statusLabel, variant: statusVariant } = STATUS_CONFIG[order.status]
  const isCancelled = order.status === 'cancelled'

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col overflow-y-auto">

        {/* Header */}
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between pr-8">
            <div>
              <SheetTitle>{order.orderRef}</SheetTitle>
              <SheetDescription>
                Ordered {new Date(order.orderDate).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </SheetDescription>
            </div>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {order.customerName ?? 'Walk-in customer'}
            </span>
            <span>·</span>
            <span>Created by {order.createdByName}</span>
          </div>

          {/* Fulfillment progress */}
          {!isCancelled && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Fulfillment</span>
                <span className="text-[10px] text-muted-foreground">{order.fulfillmentPercent}%</span>
              </div>
              <ProgressBar percent={order.fulfillmentPercent} />
            </div>
          )}

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
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Fulfilled</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Agreed Price</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lineItems.map(li => {
                    const fullyFulfilled = li.quantityFulfilled >= li.quantity
                    return (
                      <tr key={li.id} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-2">
                          <div className="font-medium text-foreground">{li.item.name}</div>
                          {li.item.brand && (
                            <div className="text-[10px] text-muted-foreground">{li.item.brand}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={
                            fullyFulfilled ? 'text-foreground'
                            : li.quantityFulfilled > 0 ? 'text-amber-600 font-medium'
                            : 'text-muted-foreground'
                          }>
                            {formatStock(li.quantityFulfilled)} / {formatStock(li.quantity)}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {li.item.saleUnitAbbreviation}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">
                          {formatCurrency(li.agreedUnitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-foreground">
                          {formatCurrency(li.quantity * li.agreedUnitPrice)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
              Prices are locked at order time and do not change with stock cost.
            </p>
          </section>

          {/* Financial Summary */}
          <section>
            <SectionHeader>Financials</SectionHeader>
            <div className="rounded-lg border border-border/60 px-3 py-1">
              <SummaryRow label="Order total" value={formatCurrency(order.orderTotal)} />
              <SummaryRow label="Deposited" value={formatCurrency(order.totalDeposited)} />
              {order.totalRefunded > 0 && (
                <SummaryRow label="Refunded" value={`− ${formatCurrency(order.totalRefunded)}`} highlight="destructive" />
              )}
              <SummaryRow label="Net deposit held" value={formatCurrency(order.netDepositHeld)} />
              <SummaryRow
                label={isCancelled ? 'Balance' : 'Balance remaining'}
                value={
                  isCancelled ? '—'
                  : order.balanceRemaining > 0 ? formatCurrency(order.balanceRemaining)
                  : 'Fully covered'
                }
                bold
                highlight={!isCancelled && order.balanceRemaining > 0 ? 'destructive' : undefined}
              />
            </div>
          </section>

          {/* Fulfillment history */}
          <section>
            <SectionHeader>
              Fulfillments
              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                ({order.fulfillments.length})
              </span>
            </SectionHeader>
            {order.fulfillments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center rounded-lg border border-border/60">
                Not yet fulfilled
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {order.fulfillments.map(f => (
                  <div key={f.id} className="rounded-lg border border-border/60 px-3 py-2 flex items-start gap-2">
                    <PackageCheck className="size-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">
                          {/* TODO: link to the generated sale */}
                          Sale {f.saleRef}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(f.fulfillmentDate).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                      {f.notes && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{f.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Deposits & Refunds */}
          <section>
            <SectionHeader>Deposits &amp; Refunds</SectionHeader>
            {order.deposits.length === 0 && order.refunds.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center rounded-lg border border-border/60">
                No deposits recorded
              </p>
            ) : (
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Method</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.deposits.map(d => (
                      <tr key={d.id} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-2 text-foreground">
                          {new Date(d.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">Deposit</td>
                        <td className="px-3 py-2 text-muted-foreground">{PAYMENT_METHOD_LABELS[d.paymentMethod]}</td>
                        <td className="px-3 py-2 text-right font-medium text-foreground">{formatCurrency(d.amount)}</td>
                      </tr>
                    ))}
                    {order.refunds.map(r => (
                      <tr key={r.id} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-2 text-foreground">
                          {new Date(r.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-3 py-2 text-destructive">Refund</td>
                        <td className="px-3 py-2 text-muted-foreground">{PAYMENT_METHOD_LABELS[r.paymentMethod]}</td>
                        <td className="px-3 py-2 text-right font-medium text-destructive">− {formatCurrency(r.amount)}</td>
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
