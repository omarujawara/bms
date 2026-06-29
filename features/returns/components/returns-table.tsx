'use client'

import { useState, useMemo } from 'react'
import {
  Plus, Search, MoreHorizontal, Eye, Undo2, User,
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
import { ReturnDetailSheet } from './return-detail-sheet'
import type { SaleReturnWithTotals } from '../types'

// TODO: replace with session user role once auth is wired (read from server session)
const CURRENT_ROLE: 'owner' | 'sales_rep' = 'owner'

interface ReturnsTableProps {
  returns: SaleReturnWithTotals[]
}

export function ReturnsTable({ returns }: ReturnsTableProps) {
  const isOwner = CURRENT_ROLE === 'owner'

  const [search, setSearch]             = useState('')
  const [refundFilter, setRefundFilter] = useState('all')
  const [selectedReturn, setSelectedReturn] = useState<SaleReturnWithTotals | null>(null)

  const refundStatusOf = (r: SaleReturnWithTotals) =>
    r.refundOutstanding <= 0 ? 'settled' : r.totalRefunded === 0 ? 'pending' : 'partial'

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return returns.filter(r => {
      if (q) {
        const haystack = `${r.returnRef} ${r.originalSaleRef} ${r.customerName ?? ''} ${r.createdByName}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (refundFilter !== 'all' && refundStatusOf(r) !== refundFilter) return false
      return true
    })
  }, [returns, search, refundFilter])

  const stats = useMemo(() => ({
    count:       returns.length,
    refundTotal: returns.reduce((s, r) => s + r.totalRefund, 0),
    outstanding: returns.reduce((s, r) => s + Math.max(r.refundOutstanding, 0), 0),
    costRestored: returns.reduce((s, r) => s + r.totalCostRestored, 0),
  }), [returns])

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Returns</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sale returns, refunds, and stock restoration
          </p>
        </div>
        {/* TODO: open New Return form — starts by selecting an original sale */}
        <Button size="sm">
          <Plus />
          New Return
        </Button>
      </div>

      {/* Stats */}
      <div className={`grid gap-3 ${isOwner ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <StatCard label="Returns" value={stats.count.toString()} />
        <StatCard label="Refund Value" value={formatCurrency(stats.refundTotal)} />
        <StatCard
          label="Refunds Outstanding"
          value={stats.outstanding > 0 ? formatCurrency(stats.outstanding) : '—'}
          valueClass={stats.outstanding > 0 ? 'text-destructive' : 'text-muted-foreground'}
        />
        {isOwner && (
          <StatCard label="Cost Restored" value={formatCurrency(stats.costRestored)}
            valueClass="text-muted-foreground" sub="owner only" />
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by ref, sale, customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>

        <Select value={refundFilter} onValueChange={setRefundFilter}>
          <SelectTrigger className="min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All refunds</SelectItem>
            <SelectItem value="settled">Refunded</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        {(search || refundFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setRefundFilter('all') }}>
            Clear
          </Button>
        )}

        <span className="ml-auto text-[10px] text-muted-foreground">
          {filtered.length} of {returns.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4 w-20">Ref</TableHead>
              <TableHead className="w-28">Date</TableHead>
              <TableHead className="w-20">Sale</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Refund</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Undo2 className="size-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No returns match your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.map(r => {
              const status = refundStatusOf(r)
              const itemCount = r.lineItems.length

              return (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedReturn(r)}
                >
                  <TableCell className="pl-4 font-medium text-foreground">{r.returnRef}</TableCell>

                  <TableCell className="text-muted-foreground">
                    {new Date(r.returnDate).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </TableCell>

                  {/* Original sale ref */}
                  <TableCell>
                    <span className="text-muted-foreground">{r.originalSaleRef}</span>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    {r.customerName
                      ? <span className="text-foreground">{r.customerName}</span>
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
                    <span className="text-foreground">{r.lineItems[0]?.item.name}</span>
                    {itemCount > 1 && (
                      <span className="text-[10px] text-muted-foreground"> +{itemCount - 1} more</span>
                    )}
                  </TableCell>

                  {/* Refund */}
                  <TableCell className="text-right font-medium text-foreground">
                    {formatCurrency(r.totalRefund)}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={
                      status === 'settled' ? 'default'
                      : status === 'pending' ? 'destructive'
                      : 'secondary'
                    }>
                      {status === 'settled' ? 'Refunded' : status === 'pending' ? 'Pending' : 'Partial'}
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
                          <DropdownMenuItem onClick={() => setSelectedReturn(r)}>
                            <Eye />
                            View details
                          </DropdownMenuItem>
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
      <ReturnDetailSheet
        saleReturn={selectedReturn}
        open={!!selectedReturn}
        onClose={() => setSelectedReturn(null)}
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
