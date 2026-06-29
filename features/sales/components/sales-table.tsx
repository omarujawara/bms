'use client'

import { useState, useMemo } from 'react'
import {
  Plus, Search, MoreHorizontal, Eye, Pencil, Receipt, User,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@utils/format'
import { SaleDetailSheet } from './sale-detail-sheet'
import type { SalesTransactionWithTotals } from '../types'

// TODO: replace with session user role once auth is wired (read from server session)
const CURRENT_ROLE: 'owner' | 'sales_rep' = 'owner'

interface SalesTableProps {
  sales: SalesTransactionWithTotals[]
}

export function SalesTable({ sales }: SalesTableProps) {
  const isOwner = CURRENT_ROLE === 'owner'

  const [search, setSearch]             = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selectedSale, setSelectedSale] = useState<SalesTransactionWithTotals | null>(null)

  const paymentStatusOf = (s: SalesTransactionWithTotals) =>
    s.balanceDue <= 0 ? 'paid' : s.totalPaid === 0 ? 'unpaid' : 'partial'

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return sales.filter(s => {
      if (q) {
        const haystack = `${s.saleRef} ${s.customerName ?? ''} ${s.createdByName}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (paymentFilter !== 'all' && paymentStatusOf(s) !== paymentFilter) return false
      return true
    })
  }, [sales, search, paymentFilter])

  const stats = useMemo(() => ({
    count:         sales.length,
    revenue:       sales.reduce((s, t) => s + t.totalRevenue, 0),
    profit:        sales.reduce((s, t) => s + t.totalProfit, 0),
    outstanding:   sales.reduce((s, t) => s + Math.max(t.balanceDue, 0), 0),
  }), [sales])

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Sales</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record and review sales transactions
          </p>
        </div>
        {/* TODO: open New Sale form. Both roles can record sales. */}
        <Button size="sm">
          <Plus />
          New Sale
        </Button>
      </div>

      {/* Stats */}
      <div className={`grid gap-3 ${isOwner ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <StatCard label="Transactions" value={stats.count.toString()} />
        <StatCard label="Revenue" value={formatCurrency(stats.revenue)} />
        {isOwner && (
          <StatCard label="Profit" value={formatCurrency(stats.profit)}
            valueClass="text-emerald-600" sub="owner only" />
        )}
        <StatCard
          label="Outstanding"
          value={stats.outstanding > 0 ? formatCurrency(stats.outstanding) : '—'}
          valueClass={stats.outstanding > 0 ? 'text-destructive' : 'text-muted-foreground'}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by ref, customer, or staff..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>

        {(search || paymentFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setPaymentFilter('all') }}>
            Clear
          </Button>
        )}

        <span className="ml-auto text-[10px] text-muted-foreground">
          {filtered.length} of {sales.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4 w-20">Ref</TableHead>
              <TableHead className="w-36">Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              {isOwner && <TableHead className="text-right">Profit</TableHead>}
              <TableHead>Payment</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={isOwner ? 8 : 7} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Receipt className="size-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No sales match your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.map(sale => {
              const status = paymentStatusOf(sale)
              const itemCount = sale.lineItems.length

              return (
                <TableRow
                  key={sale.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedSale(sale)}
                >
                  {/* Ref + same-day flag */}
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">{sale.saleRef}</span>
                      {sale.isEditable && (
                        <span
                          className="size-1.5 rounded-full bg-amber-500 shrink-0"
                          title="Created today — editable"
                        />
                      )}
                    </div>
                  </TableCell>

                  {/* Date + time */}
                  <TableCell className="text-muted-foreground">
                    {new Date(sale.transactionDate).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                    <span className="block text-[10px]">
                      {new Date(sale.transactionDate).toLocaleTimeString('en-GB', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    {sale.customerName
                      ? <span className="text-foreground">{sale.customerName}</span>
                      : (
                        <span className="flex items-center gap-1 text-muted-foreground italic">
                          <User className="size-3" />
                          Walk-in
                        </span>
                      )
                    }
                  </TableCell>

                  {/* Items */}
                  <TableCell>
                    <span className="text-foreground">{sale.lineItems[0]?.item.name}</span>
                    {itemCount > 1 && (
                      <span className="text-[10px] text-muted-foreground"> +{itemCount - 1} more</span>
                    )}
                  </TableCell>

                  {/* Total */}
                  <TableCell className="text-right font-medium text-foreground">
                    {formatCurrency(sale.totalRevenue)}
                  </TableCell>

                  {/* Profit — owner only */}
                  {isOwner && (
                    <TableCell className="text-right text-emerald-600">
                      {formatCurrency(sale.totalProfit)}
                    </TableCell>
                  )}

                  {/* Payment status */}
                  <TableCell>
                    <Badge variant={
                      status === 'paid' ? 'default'
                      : status === 'unpaid' ? 'destructive'
                      : 'secondary'
                    }>
                      {status === 'paid' ? 'Paid' : status === 'unpaid' ? 'Unpaid' : 'Partial'}
                    </Badge>
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
                          <DropdownMenuItem onClick={() => setSelectedSale(sale)}>
                            <Eye />
                            View details
                          </DropdownMenuItem>
                          {/* Same-day edit rule: only editable on creation day */}
                          {sale.isEditable && (
                            <DropdownMenuItem>
                              <Pencil />
                              Edit sale
                            </DropdownMenuItem>
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
      <SaleDetailSheet
        sale={selectedSale}
        open={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        isOwner={isOwner}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string
  value: string
  sub?: string
  valueClass?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={`text-lg font-semibold leading-none ${valueClass ?? 'text-foreground'}`}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  )
}
