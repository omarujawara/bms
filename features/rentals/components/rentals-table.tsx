'use client'

import { useState, useMemo } from 'react'
import {
  Plus, Search, MoreHorizontal, Eye, PackageCheck, AlertTriangle, Boxes,
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
import { RentalDetailSheet } from './rental-detail-sheet'
import type { RentalWithDerived } from '../types'

interface RentalsTableProps {
  rentals: RentalWithDerived[]
}

// Derived display status: overdue is computed, never stored.
function displayStatus(r: RentalWithDerived): 'active' | 'overdue' | 'returned' {
  if (r.status === 'returned') return 'returned'
  return r.isOverdue ? 'overdue' : 'active'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function RentalsTable({ rentals }: RentalsTableProps) {
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRental, setSelectedRental] = useState<RentalWithDerived | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rentals.filter(r => {
      if (q) {
        const haystack = `${r.rentalRef} ${r.item.name} ${r.customer.fullName}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (statusFilter !== 'all' && displayStatus(r) !== statusFilter) return false
      return true
    })
  }, [rentals, search, statusFilter])

  const stats = useMemo(() => ({
    active:      rentals.filter(r => r.status === 'active').length,
    overdue:     rentals.filter(r => r.isOverdue).length,
    outstanding: rentals.reduce((s, r) => s + Math.max(r.balanceDue, 0), 0),
  }), [rentals])

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Rentals</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Equipment rentals, returns, and payments
          </p>
        </div>
        {/* TODO: open New Rental form — only available equipment selectable */}
        <Button size="sm">
          <Plus />
          New Rental
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Active Rentals" value={stats.active.toString()} />
        <StatCard
          label="Overdue"
          value={stats.overdue.toString()}
          valueClass={stats.overdue > 0 ? 'text-destructive' : 'text-muted-foreground'}
          icon={stats.overdue > 0 ? <AlertTriangle className="size-3.5 text-destructive" /> : undefined}
        />
        <StatCard
          label="Outstanding Balance"
          value={stats.outstanding > 0 ? formatCurrency(stats.outstanding) : '—'}
          valueClass={stats.outstanding > 0 ? 'text-destructive' : 'text-muted-foreground'}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by ref, equipment, customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>

        {(search || statusFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all') }}>
            Clear
          </Button>
        )}

        <span className="ml-auto text-[10px] text-muted-foreground">
          {filtered.length} of {rentals.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4 w-20">Ref</TableHead>
              <TableHead>Equipment</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="w-28">Started</TableHead>
              <TableHead className="w-28">Due / Returned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Boxes className="size-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No rentals match your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.map(r => {
              const status = displayStatus(r)
              const returned = r.status === 'returned'

              return (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedRental(r)}
                >
                  <TableCell className="pl-4 font-medium text-foreground">{r.rentalRef}</TableCell>

                  <TableCell>
                    <div className="font-medium text-foreground">{r.item.name}</div>
                    <div className="text-[10px] text-muted-foreground">{r.item.categoryName}</div>
                  </TableCell>

                  <TableCell className="text-foreground">{r.customer.fullName}</TableCell>

                  <TableCell className="text-muted-foreground">{formatDate(r.startDate)}</TableCell>

                  {/* Due (active) or actual return (returned) */}
                  <TableCell>
                    {returned
                      ? <span className="text-muted-foreground">{formatDate(r.actualReturnDate!)}</span>
                      : (
                        <span className={r.isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                          {formatDate(r.expectedReturnDate)}
                        </span>
                      )
                    }
                  </TableCell>

                  {/* Derived status */}
                  <TableCell>
                    <Badge variant={
                      status === 'returned' ? 'outline'
                      : status === 'overdue' ? 'destructive'
                      : 'default'
                    }>
                      {status === 'returned' ? 'Returned' : status === 'overdue' ? 'Overdue' : 'Active'}
                    </Badge>
                  </TableCell>

                  {/* Balance */}
                  <TableCell className="text-right">
                    {r.balanceDue <= 0
                      ? <span className="text-muted-foreground text-[10px]">Settled</span>
                      : <span className="text-destructive font-medium">{formatCurrency(r.balanceDue)}</span>
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
                          <DropdownMenuItem onClick={() => setSelectedRental(r)}>
                            <Eye />
                            View details
                          </DropdownMenuItem>
                          {/* Mark Returned only for active rentals */}
                          {r.status === 'active' && (
                            <DropdownMenuItem>
                              <PackageCheck />
                              Mark returned
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
      <RentalDetailSheet
        rental={selectedRental}
        open={!!selectedRental}
        onClose={() => setSelectedRental(null)}
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
