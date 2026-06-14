'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, MoreHorizontal, Eye, PackageMinus } from 'lucide-react'

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
import { formatCurrency, formatStock } from '@utils/format'
import { StockAdjustmentDetailSheet, REASON_CONFIG } from './stock-adjustment-detail-sheet'
import type { StockAdjustmentReason, StockAdjustmentWithTotals } from '../types'

// TODO: replace with session user role once auth is wired (read from server session)
const CURRENT_ROLE: 'owner' | 'sales_rep' = 'owner'

const REASON_OPTIONS: { value: StockAdjustmentReason; label: string }[] = [
  { value: 'damaged',      label: 'Damaged' },
  { value: 'missing',      label: 'Missing' },
  { value: 'internal_use', label: 'Internal Use' },
  { value: 'given_away',   label: 'Given Away' },
  { value: 'correction',   label: 'Correction' },
]

interface StockAdjustmentsTableProps {
  adjustments: StockAdjustmentWithTotals[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function StockAdjustmentsTable({ adjustments }: StockAdjustmentsTableProps) {
  const isOwner = CURRENT_ROLE === 'owner'

  const [search, setSearch]             = useState('')
  const [reasonFilter, setReasonFilter] = useState('all')
  const [selected, setSelected]         = useState<StockAdjustmentWithTotals | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return adjustments.filter(a => {
      if (q) {
        const haystack = `${a.adjustmentRef} ${a.item.name} ${a.createdByName}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (reasonFilter !== 'all' && a.reason !== reasonFilter) return false
      return true
    })
  }, [adjustments, search, reasonFilter])

  const stats = useMemo(() => ({
    count:     adjustments.length,
    writeOff:  adjustments.filter(a => a.reason === 'damaged' || a.reason === 'missing').length,
    totalCost: adjustments.reduce((s, a) => s + a.totalCost, 0),
  }), [adjustments])

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Stock Adjustments</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record stock removed for damage, loss, internal use, or corrections
          </p>
        </div>
        {/* TODO: open New Adjustment form. Both roles can record adjustments. */}
        <Button size="sm">
          <Plus />
          New Adjustment
        </Button>
      </div>

      {/* Stats */}
      <div className={`grid gap-3 ${isOwner ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <StatCard label="Adjustments" value={stats.count.toString()} />
        <StatCard label="Damage / Loss" value={stats.writeOff.toString()}
          valueClass={stats.writeOff > 0 ? 'text-destructive' : undefined} />
        {isOwner && (
          <StatCard label="Total Cost Removed" value={formatCurrency(stats.totalCost)} sub="owner only" />
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by ref, item, staff..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>

        <Select value={reasonFilter} onValueChange={setReasonFilter}>
          <SelectTrigger className="min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reasons</SelectItem>
            {REASON_OPTIONS.map(r => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(search || reasonFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setReasonFilter('all') }}>
            Clear
          </Button>
        )}

        <span className="ml-auto text-[10px] text-muted-foreground">
          {filtered.length} of {adjustments.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4 w-24">Ref</TableHead>
              <TableHead className="w-28">Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Removed</TableHead>
              <TableHead>Reason</TableHead>
              {isOwner && <TableHead className="text-right">Cost</TableHead>}
              <TableHead>By</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={isOwner ? 8 : 7} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <PackageMinus className="size-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No adjustments match your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.map(a => {
              const reason = REASON_CONFIG[a.reason]
              return (
                <TableRow
                  key={a.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(a)}
                >
                  <TableCell className="pl-4 font-medium text-foreground">{a.adjustmentRef}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{a.item.name}</div>
                    {a.item.brand && (
                      <div className="text-[10px] text-muted-foreground">{a.item.brand}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-destructive font-medium">
                      − {formatStock(a.quantity)} {a.item.baseUnitAbbreviation}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={reason.variant}>{reason.label}</Badge>
                  </TableCell>
                  {isOwner && (
                    <TableCell className="text-right text-foreground">
                      {formatCurrency(a.totalCost)}
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">{a.createdByName}</TableCell>
                  <TableCell>
                    <div onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon" />}
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="bottom">
                          <DropdownMenuItem onClick={() => setSelected(a)}>
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
      <StockAdjustmentDetailSheet
        adjustment={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
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
