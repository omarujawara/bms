'use client'

import { useState, useMemo } from 'react'
import {
  Plus, MoreHorizontal, Eye, Pencil, XCircle,
  CheckCircle2, MinusCircle, Circle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@utils/format'
import { PurchaseOrderSheet } from './purchase-order-sheet'
import type { PurchaseOrderStatus, PurchaseOrderWithTotals } from '../types'

const STATUS_CONFIG: Record<PurchaseOrderStatus, {
  label: string
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
}> = {
  pending_delivery:   { label: 'Pending',   variant: 'outline' },
  partially_received: { label: 'Partial',   variant: 'secondary' },
  received:           { label: 'Received',  variant: 'default' },
  cancelled:          { label: 'Cancelled', variant: 'destructive' },
}

function ReceivingIndicator({ orders }: { orders: PurchaseOrderWithTotals }) {
  const total    = orders.lineItems.length
  const done     = orders.lineItems.filter(li => li.quantityReceived >= li.quantityOrdered).length
  const partial  = orders.lineItems.filter(li => li.quantityReceived > 0 && li.quantityReceived < li.quantityOrdered).length

  if (orders.status === 'cancelled') {
    return <span className="text-muted-foreground">—</span>
  }
  if (done === total) {
    return (
      <span className="flex items-center gap-1 text-foreground">
        <CheckCircle2 className="size-3 text-primary shrink-0" />
        All {total} received
      </span>
    )
  }
  if (done === 0 && partial === 0) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <Circle className="size-3 shrink-0" />
        {total} line{total !== 1 ? 's' : ''} pending
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-amber-600">
      <MinusCircle className="size-3 shrink-0" />
      {done} of {total} lines done
    </span>
  )
}

interface PurchaseOrdersTableProps {
  orders: PurchaseOrderWithTotals[]
}

export function PurchaseOrdersTable({ orders }: PurchaseOrdersTableProps) {
  const [statusFilter, setStatusFilter]     = useState('all')
  const [selectedOrder, setSelectedOrder]   = useState<PurchaseOrderWithTotals | null>(null)

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter(o => o.status === statusFilter)
  }, [orders, statusFilter])

  const stats = useMemo(() => ({
    total:         orders.length,
    pending:       orders.filter(o => o.status === 'pending_delivery').length,
    partial:       orders.filter(o => o.status === 'partially_received').length,
    totalOwed:     orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.balanceDue, 0),
  }), [orders])

  const canEdit   = (o: PurchaseOrderWithTotals) => o.status === 'pending_delivery'
  const canCancel = (o: PurchaseOrderWithTotals) =>
    o.status === 'pending_delivery' || o.status === 'partially_received'

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Purchasing</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Purchase orders, receiving, and supplier payments
          </p>
        </div>
        {/* TODO: open New Purchase Order form */}
        <Button size="sm">
          <Plus />
          New Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Orders"   value={stats.total.toString()} />
        <StatCard label="Pending Delivery" value={stats.pending.toString()}
          valueClass={stats.pending > 0 ? 'text-foreground' : undefined} />
        <StatCard label="Partially Received" value={stats.partial.toString()}
          valueClass={stats.partial > 0 ? 'text-amber-600' : undefined} />
        <StatCard
          label="Outstanding Balance"
          value={stats.totalOwed > 0 ? formatCurrency(stats.totalOwed) : '—'}
          valueClass={stats.totalOwed > 0 ? 'text-destructive' : 'text-muted-foreground'}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="min-w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending_delivery">Pending Delivery</SelectItem>
            <SelectItem value="partially_received">Partially Received</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {statusFilter !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')}>
            Clear
          </Button>
        )}

        <span className="ml-auto text-[10px] text-muted-foreground">
          {filtered.length} of {orders.length} orders
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4 w-24">Order</TableHead>
              <TableHead className="w-32">Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Receiving</TableHead>
              <TableHead className="text-right">Order Total</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Circle className="size-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No orders match this filter</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.map(order => {
              const { label, variant } = STATUS_CONFIG[order.status]
              const isCancelled = order.status === 'cancelled'

              return (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  {/* Order ref */}
                  <TableCell className="pl-4 font-medium text-foreground">
                    {order.orderRef}
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-muted-foreground">
                    {new Date(order.orderDate).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </TableCell>

                  {/* Items summary */}
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {order.lineItems.slice(0, 2).map(li => (
                        <span key={li.id} className="text-foreground leading-snug">
                          {li.item.name}
                          {li.item.brand && (
                            <span className="text-muted-foreground"> · {li.item.brand}</span>
                          )}
                        </span>
                      ))}
                      {order.lineItems.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{order.lineItems.length - 2} more
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={variant}>{label}</Badge>
                  </TableCell>

                  {/* Receiving */}
                  <TableCell className="text-xs">
                    <ReceivingIndicator orders={order} />
                  </TableCell>

                  {/* Order total */}
                  <TableCell className="text-right">
                    {isCancelled
                      ? <span className="text-muted-foreground">—</span>
                      : <span className="text-foreground">{formatCurrency(order.totalCost)}</span>
                    }
                  </TableCell>

                  {/* Balance due */}
                  <TableCell className="text-right">
                    {isCancelled
                      ? <span className="text-muted-foreground">—</span>
                      : order.balanceDue === 0
                      ? <span className="text-muted-foreground text-[10px]">Paid</span>
                      : <span className="text-destructive font-medium">{formatCurrency(order.balanceDue)}</span>
                    }
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon" />}
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="bottom">
                          <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                            <Eye />
                            View details
                          </DropdownMenuItem>
                          {canEdit(order) && (
                            <DropdownMenuItem>
                              <Pencil />
                              Edit order
                            </DropdownMenuItem>
                          )}
                          {canCancel(order) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive">
                                <XCircle />
                                Cancel order
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Detail sheet */}
      <PurchaseOrderSheet
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={`text-lg font-semibold leading-none ${valueClass ?? 'text-foreground'}`}>
        {value}
      </span>
    </div>
  )
}
