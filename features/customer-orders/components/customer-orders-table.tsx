'use client'

import { useState, useMemo } from 'react'
import {
  Plus, Search, MoreHorizontal, Eye, PackagePlus, XCircle, ClipboardList, User,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { CustomerOrderSheet } from './customer-order-sheet'
import type { CustomerOrderStatus, CustomerOrderWithTotals } from '../types'

const STATUS_CONFIG: Record<CustomerOrderStatus, {
  label: string
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
}> = {
  pending:             { label: 'Pending',   variant: 'outline' },
  partially_fulfilled: { label: 'Partial',   variant: 'secondary' },
  fulfilled:           { label: 'Fulfilled', variant: 'default' },
  cancelled:           { label: 'Cancelled', variant: 'destructive' },
}

function MiniProgress({ percent, cancelled }: { percent: number; cancelled: boolean }) {
  if (cancelled) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${percent >= 100 ? 'bg-primary' : 'bg-amber-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums">{percent}%</span>
    </div>
  )
}

interface CustomerOrdersTableProps {
  orders: CustomerOrderWithTotals[]
}

export function CustomerOrdersTable({ orders }: CustomerOrdersTableProps) {
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrderWithTotals | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter(o => {
      if (q) {
        const haystack = `${o.orderRef} ${o.customerName ?? ''} ${o.createdByName}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      return true
    })
  }, [orders, search, statusFilter])

  const stats = useMemo(() => ({
    open:          orders.filter(o => o.status === 'pending' || o.status === 'partially_fulfilled').length,
    orderValue:    orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.orderTotal, 0),
    depositsHeld:  orders.reduce((s, o) => s + Math.max(o.netDepositHeld, 0), 0),
    balanceDue:    orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Math.max(o.balanceRemaining, 0), 0),
  }), [orders])

  const canFulfill = (o: CustomerOrderWithTotals) =>
    o.status === 'pending' || o.status === 'partially_fulfilled'
  const canCancel = (o: CustomerOrderWithTotals) =>
    o.status === 'pending' || o.status === 'partially_fulfilled'

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Customer Orders</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pre-orders, deposits, and fulfillment tracking
          </p>
        </div>
        {/* TODO: open New Customer Order form */}
        <Button size="sm">
          <Plus />
          New Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Open Orders" value={stats.open.toString()} />
        <StatCard label="Order Value" value={formatCurrency(stats.orderValue)} />
        <StatCard label="Deposits Held" value={formatCurrency(stats.depositsHeld)} />
        <StatCard
          label="Balance Due"
          value={stats.balanceDue > 0 ? formatCurrency(stats.balanceDue) : '—'}
          valueClass={stats.balanceDue > 0 ? 'text-destructive' : 'text-muted-foreground'}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by ref, customer, staff..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partially_fulfilled">Partially Fulfilled</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {(search || statusFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all') }}>
            Clear
          </Button>
        )}

        <span className="ml-auto text-[10px] text-muted-foreground">
          {filtered.length} of {orders.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4 w-20">Ref</TableHead>
              <TableHead className="w-28">Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32">Fulfillment</TableHead>
              <TableHead className="text-right">Order Total</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <ClipboardList className="size-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No orders match your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.map(o => {
              const { label, variant } = STATUS_CONFIG[o.status]
              const isCancelled = o.status === 'cancelled'

              return (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedOrder(o)}
                >
                  <TableCell className="pl-4 font-medium text-foreground">{o.orderRef}</TableCell>

                  <TableCell className="text-muted-foreground">
                    {new Date(o.orderDate).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </TableCell>

                  <TableCell>
                    {o.customerName
                      ? <span className="text-foreground">{o.customerName}</span>
                      : (
                        <span className="flex items-center gap-1 text-muted-foreground italic">
                          <User className="size-3" />
                          Walk-in
                        </span>
                      )
                    }
                  </TableCell>

                  <TableCell>
                    <Badge variant={variant}>{label}</Badge>
                  </TableCell>

                  <TableCell>
                    <MiniProgress percent={o.fulfillmentPercent} cancelled={isCancelled} />
                  </TableCell>

                  <TableCell className="text-right">
                    {isCancelled
                      ? <span className="text-muted-foreground">—</span>
                      : <span className="text-foreground">{formatCurrency(o.orderTotal)}</span>
                    }
                  </TableCell>

                  <TableCell className="text-right">
                    {isCancelled
                      ? <span className="text-muted-foreground">—</span>
                      : o.balanceRemaining <= 0
                      ? <span className="text-muted-foreground text-[10px]">Covered</span>
                      : <span className="text-destructive font-medium">{formatCurrency(o.balanceRemaining)}</span>
                    }
                  </TableCell>

                  <TableCell>
                    <div onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon" />}
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="bottom">
                          <DropdownMenuItem onClick={() => setSelectedOrder(o)}>
                            <Eye />
                            View details
                          </DropdownMenuItem>
                          {canFulfill(o) && (
                            // TODO: open Fulfill flow — generates a sale
                            <DropdownMenuItem>
                              <PackagePlus />
                              Fulfill order
                            </DropdownMenuItem>
                          )}
                          {canCancel(o) && (
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
      <CustomerOrderSheet
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
