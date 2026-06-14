'use client'

import { User, Phone, IdCard, Calendar, AlertTriangle, PackageCheck } from 'lucide-react'

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
import type { PaymentMethod, RentalWithDerived } from '../types'

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash', transfer: 'Transfer', other: 'Other',
}

interface RentalDetailSheetProps {
  rental: RentalWithDerived | null
  open: boolean
  onClose: () => void
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

function SummaryRow({
  label,
  value,
  bold,
  highlight,
}: {
  label: string
  value: string
  bold?: boolean
  highlight?: 'destructive'
}) {
  const valueClass = highlight === 'destructive' ? 'text-destructive' : 'text-foreground'
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

export function RentalDetailSheet({ rental, open, onClose }: RentalDetailSheetProps) {
  if (!rental) return null

  const statusLabel = rental.status === 'returned' ? 'Returned'
    : rental.isOverdue ? 'Overdue' : 'Active'
  const statusVariant = rental.status === 'returned' ? 'outline'
    : rental.isOverdue ? 'destructive' : 'default'

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-md w-full flex flex-col overflow-y-auto">

        {/* Header */}
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between pr-8">
            <div>
              <SheetTitle>{rental.item.name}</SheetTitle>
              <SheetDescription>{rental.rentalRef} · {rental.item.categoryName}</SheetDescription>
            </div>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>

          {rental.isOverdue && (
            <div className="flex items-center gap-1.5 mt-2 rounded-md bg-destructive/10 px-3 py-2">
              <AlertTriangle className="size-3.5 text-destructive shrink-0" />
              <span className="text-xs text-destructive">
                {rental.daysOut} days out — expected back {formatDate(rental.expectedReturnDate)}
              </span>
            </div>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6 flex-1">

          {/* Customer */}
          <section>
            <SectionHeader>Customer</SectionHeader>
            <div className="rounded-lg border border-border/60 px-3 py-1">
              <DetailRow
                label="Name"
                value={<span className="flex items-center justify-end gap-1"><User className="size-3 text-muted-foreground" />{rental.customer.fullName}</span>}
              />
              <DetailRow
                label="Contact"
                value={<span className="flex items-center justify-end gap-1"><Phone className="size-3 text-muted-foreground" />{rental.customer.contactNumber}</span>}
              />
              <DetailRow
                label="ID on file"
                value={
                  rental.customer.idImageUrl
                    ? (
                      // TODO: open the ID image (Supabase Storage signed URL)
                      <Button variant="link" size="xs" className="h-auto p-0">
                        <IdCard className="size-3" />
                        View ID
                      </Button>
                    )
                    : <span className="text-muted-foreground">Not provided</span>
                }
              />
            </div>
          </section>

          {/* Rental terms */}
          <section>
            <SectionHeader>Rental Terms</SectionHeader>
            <div className="rounded-lg border border-border/60 px-3 py-1">
              <DetailRow
                label="Start date"
                value={<span className="flex items-center justify-end gap-1"><Calendar className="size-3 text-muted-foreground" />{formatDate(rental.startDate)}</span>}
              />
              <DetailRow label="Expected return" value={formatDate(rental.expectedReturnDate)} />
              <DetailRow
                label="Actual return"
                value={rental.actualReturnDate ? formatDate(rental.actualReturnDate) : <span className="text-muted-foreground">Not returned</span>}
              />
              <DetailRow
                label="Rate"
                value={
                  <span>
                    {formatCurrency(rental.rateSnapshot)}
                    <span className="text-muted-foreground"> / {rental.rateType === 'weekly' ? 'week' : 'day'}</span>
                  </span>
                }
              />
              <DetailRow label="Duration" value={`${rental.daysOut} day${rental.daysOut !== 1 ? 's' : ''}`} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
              Rate is snapshotted at rental start and does not change.
            </p>
          </section>

          {/* Charges */}
          <section>
            <SectionHeader>Charges</SectionHeader>
            <div className="rounded-lg border border-border/60 px-3 py-1">
              <SummaryRow
                label={rental.status === 'active' ? 'Estimated charge' : 'Total charge'}
                value={formatCurrency(rental.estimatedCharge)}
              />
              <SummaryRow label="Paid" value={formatCurrency(rental.totalPaid)} />
              <SummaryRow
                label="Balance due"
                value={rental.balanceDue > 0 ? formatCurrency(rental.balanceDue) : 'Settled'}
                bold
                highlight={rental.balanceDue > 0 ? 'destructive' : undefined}
              />
            </div>
            {rental.status === 'active' && (
              <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                Estimate based on days out so far; final charge is set on return.
              </p>
            )}
          </section>

          {/* Payments */}
          <section>
            <SectionHeader>
              Payments
              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                ({rental.payments.length})
              </span>
            </SectionHeader>
            {rental.payments.length === 0 ? (
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
                    {rental.payments.map(p => (
                      <tr key={p.id} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-2 text-foreground">{formatDate(p.paymentDate)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{PAYMENT_METHOD_LABELS[p.paymentMethod]}</td>
                        <td className="px-3 py-2 text-right font-medium text-foreground">{formatCurrency(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {rental.notes && (
            <section>
              <SectionHeader>Notes</SectionHeader>
              <p className="text-xs text-muted-foreground leading-relaxed rounded-lg border border-border/60 px-3 py-2">
                {rental.notes}
              </p>
            </section>
          )}

          {/* Return action — only for active rentals */}
          {rental.status === 'active' && (
            <div className="mt-auto">
              {/* TODO: open Mark Returned flow — sets actual_return_date, status, final charge */}
              <Button className="w-full" size="sm">
                <PackageCheck />
                Mark as Returned
              </Button>
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  )
}
