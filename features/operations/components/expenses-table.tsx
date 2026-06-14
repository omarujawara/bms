'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Receipt } from 'lucide-react'

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
import type { Expense } from '../types'

// This page lives under (owner)/ — expenses are owner-only by route.
// No in-component role gate is needed.

interface ExpensesTableProps {
  expenses: Expense[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  const [search, setSearch]                 = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const categories = useMemo(
    () => Array.from(new Set(expenses.map(e => e.categoryName))).sort(),
    [expenses]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return expenses.filter(e => {
      if (q && !e.description.toLowerCase().includes(q) && !e.categoryName.toLowerCase().includes(q)) return false
      if (categoryFilter !== 'all' && e.categoryName !== categoryFilter) return false
      return true
    })
  }, [expenses, search, categoryFilter])

  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0)
    const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0)
    return { total, filteredTotal, count: expenses.length }
  }, [expenses, filtered])

  const isFiltered = search !== '' || categoryFilter !== 'all'

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Expenses</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Business overheads and operating costs
          </p>
        </div>
        {/* TODO: open New Expense form */}
        <Button size="sm">
          <Plus />
          New Expense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Entries" value={stats.count.toString()} />
        <StatCard label="Total Expenses" value={formatCurrency(stats.total)} />
        <StatCard label="Categories" value={categories.length.toString()} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search description or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCategoryFilter('all') }}>
            Clear
          </Button>
        )}

        <span className="ml-auto text-[10px] text-muted-foreground">
          {filtered.length} of {expenses.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4 w-28">Date</TableHead>
              <TableHead className="w-36">Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>By</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Receipt className="size-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No expenses match your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.map(e => (
              <TableRow key={e.id}>
                <TableCell className="pl-4 text-muted-foreground">{formatDate(e.expenseDate)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{e.categoryName}</Badge>
                </TableCell>
                <TableCell className="text-foreground">{e.description}</TableCell>
                <TableCell className="text-muted-foreground">{e.createdByName}</TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {formatCurrency(e.amount)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon" />}
                    >
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="bottom">
                      {/* TODO: open Edit Expense form */}
                      <DropdownMenuItem>
                        <Pencil />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive">
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-muted/20">
                <td colSpan={4} className="px-4 py-2 text-xs font-medium text-muted-foreground">
                  {isFiltered ? 'Filtered total' : 'Total'}
                </td>
                <td className="px-2 py-2 text-right text-xs font-semibold text-foreground">
                  {formatCurrency(stats.filteredTotal)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </Table>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-lg font-semibold leading-none text-foreground">{value}</span>
    </div>
  )
}
