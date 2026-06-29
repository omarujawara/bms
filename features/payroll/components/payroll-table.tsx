'use client'

import { useState, useMemo } from 'react'
import {
  Plus, Search, MoreHorizontal, Eye, AlertTriangle, Wallet,
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
import { PayrollPeriodDetailSheet } from './payroll-period-detail-sheet'
import type {
  PayrollAdjustment,
  PayrollAdjustmentReason,
  PayrollPeriodWithDetail,
} from '../types'

const REASON_LABELS: Record<PayrollAdjustmentReason, string> = {
  sale_return: 'Sale return',
  correction: 'Correction',
  other: 'Other',
}

interface PayrollTableProps {
  periods: PayrollPeriodWithDetail[]
  pendingAdjustments: PayrollAdjustment[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function PayrollTable({ periods, pendingAdjustments }: PayrollTableProps) {
  const [search, setSearch]           = useState('')
  const [staffFilter, setStaffFilter] = useState('all')
  const [selected, setSelected]       = useState<PayrollPeriodWithDetail | null>(null)

  const staffList = useMemo(
    () => Array.from(new Map(periods.map(p => [p.staff.id, p.staff])).values()),
    [periods]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return periods.filter(p => {
      if (q && !p.periodRef.toLowerCase().includes(q) && !p.staff.fullName.toLowerCase().includes(q)) return false
      if (staffFilter !== 'all' && p.staff.id !== staffFilter) return false
      return true
    })
  }, [periods, search, staffFilter])

  const stats = useMemo(() => ({
    periods:    periods.length,
    totalPaid:  periods.reduce((s, p) => s + p.amountPaid, 0),
    pending:    pendingAdjustments.length,
    pendingNet: pendingAdjustments.reduce((s, a) => s + a.adjustmentAmount, 0),
  }), [periods, pendingAdjustments])

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Payroll</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Commission periods and adjustments
          </p>
        </div>
        {/* TODO: open New Payroll Period form — validates non-overlapping windows */}
        <Button size="sm">
          <Plus />
          New Period
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Periods Paid" value={stats.periods.toString()} />
        <StatCard label="Total Paid Out" value={formatCurrency(stats.totalPaid)} />
        <StatCard
          label="Pending Adjustments"
          value={stats.pending.toString()}
          valueClass={stats.pending > 0 ? 'text-amber-600' : 'text-muted-foreground'}
          icon={stats.pending > 0 ? <AlertTriangle className="size-3.5 text-amber-600" /> : undefined}
        />
      </div>

      {/* Pending adjustments callout — these must be absorbed into a future period */}
      {pendingAdjustments.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle className="size-3.5 text-amber-600" />
            <h2 className="text-xs font-medium text-foreground">
              Pending Adjustments
            </h2>
            <span className="text-[10px] text-muted-foreground">
              — not yet absorbed into a period
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {pendingAdjustments.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-md bg-card border border-border/60 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{a.staff.fullName}</span>
                    <Badge variant="outline">{REASON_LABELS[a.reason]}</Badge>
                    {a.saleReturnRef && (
                      <span className="text-[10px] text-muted-foreground">{a.saleReturnRef}</span>
                    )}
                  </div>
                  {a.notes && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{a.notes}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    From {a.originatingPeriodRef}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold ${a.adjustmentAmount < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                    {a.adjustmentAmount < 0 ? '−' : '+'} {formatCurrency(Math.abs(a.adjustmentAmount))}
                  </span>
                  {/* TODO: open Apply-to-period flow */}
                  <Button variant="outline" size="xs">Apply</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by period or staff..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>

        <Select value={staffFilter} onValueChange={setStaffFilter}>
          <SelectTrigger className="min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All staff</SelectItem>
            {staffList.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(search || staffFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStaffFilter('all') }}>
            Clear
          </Button>
        )}

        <span className="ml-auto text-[10px] text-muted-foreground">
          {filtered.length} of {periods.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4 w-20">Period</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Window</TableHead>
              <TableHead className="text-right">Gross Profit</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Wallet className="size-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No periods match your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.map(p => (
              <TableRow
                key={p.id}
                className="cursor-pointer"
                onClick={() => setSelected(p)}
              >
                <TableCell className="pl-4 font-medium text-foreground">{p.periodRef}</TableCell>
                <TableCell className="text-foreground">{p.staff.fullName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                </TableCell>
                <TableCell className="text-right text-foreground">{formatCurrency(p.grossProfit)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {(p.percentage * 100).toFixed(1)}%
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-foreground">{formatCurrency(p.baseCommission)}</span>
                  {p.absorbedTotal !== 0 && (
                    <span className={`block text-[10px] ${p.absorbedTotal < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                      {p.absorbedTotal < 0 ? '−' : '+'}{formatCurrency(Math.abs(p.absorbedTotal))} adj
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {formatCurrency(p.amountPaid)}
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
                        <DropdownMenuItem onClick={() => setSelected(p)}>
                          <Eye />
                          View details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail sheet */}
      <PayrollPeriodDetailSheet
        period={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  valueClass,
  icon,
}: {
  label: string
  value: string
  valueClass?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className={`text-lg font-semibold leading-none ${valueClass ?? 'text-foreground'}`}>
          {value}
        </span>
      </div>
    </div>
  )
}
