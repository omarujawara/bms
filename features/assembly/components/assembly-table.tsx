'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, MoreHorizontal, Eye, Hammer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatStock } from '@utils/format'
import { AssemblyDetailSheet } from './assembly-detail-sheet'
import type { AssemblyOrderWithTotals } from '../types'

// TODO: replace with session user role once auth is wired (read from server session)
const CURRENT_ROLE: 'owner' | 'sales_rep' = 'owner'

interface AssemblyTableProps {
  assemblies: AssemblyOrderWithTotals[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function AssemblyTable({ assemblies }: AssemblyTableProps) {
  const isOwner = CURRENT_ROLE === 'owner'

  const [search, setSearch] = useState('')
  const [selectedAssembly, setSelectedAssembly] = useState<AssemblyOrderWithTotals | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return assemblies
    return assemblies.filter(a => {
      const haystack = `${a.assemblyRef} ${a.outputItem.name} ${a.createdByName}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [assemblies, search])

  const stats = useMemo(() => ({
    runs:          assemblies.length,
    unitsProduced: assemblies.reduce((s, a) => s + a.quantityProduced, 0),
    totalCost:     assemblies.reduce((s, a) => s + a.totalComponentCost, 0),
  }), [assemblies])

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Assembly</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Production runs that consume components to make finished items
          </p>
        </div>
        {/* TODO: open New Assembly form — selects output item + components */}
        <Button size="sm">
          <Plus />
          New Assembly
        </Button>
      </div>

      {/* Stats */}
      <div className={`grid gap-3 ${isOwner ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <StatCard label="Assembly Runs" value={stats.runs.toString()} />
        <StatCard label="Units Produced" value={formatStock(stats.unitsProduced)} />
        {isOwner && (
          <StatCard label="Component Cost" value={formatCurrency(stats.totalCost)} sub="owner only" />
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by ref, product, staff..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
            Clear
          </Button>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {filtered.length} of {assemblies.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4 w-20">Ref</TableHead>
              <TableHead className="w-28">Date</TableHead>
              <TableHead>Produced</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Components</TableHead>
              {isOwner && <TableHead className="text-right">Unit Cost</TableHead>}
              {isOwner && <TableHead className="text-right">Total Cost</TableHead>}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={isOwner ? 8 : 6} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Hammer className="size-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No assembly runs match your search</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.map(a => (
              <TableRow
                key={a.id}
                className="cursor-pointer"
                onClick={() => setSelectedAssembly(a)}
              >
                <TableCell className="pl-4 font-medium text-foreground">{a.assemblyRef}</TableCell>

                <TableCell className="text-muted-foreground">{formatDate(a.assembledDate)}</TableCell>

                {/* Output item */}
                <TableCell>
                  <div className="font-medium text-foreground">{a.outputItem.name}</div>
                  {a.outputItem.brand && (
                    <div className="text-[10px] text-muted-foreground">{a.outputItem.brand}</div>
                  )}
                </TableCell>

                {/* Qty produced */}
                <TableCell className="text-right text-foreground">
                  {formatStock(a.quantityProduced)} {a.outputItem.saleUnitAbbreviation}
                </TableCell>

                {/* Components summary */}
                <TableCell>
                  <span className="text-foreground">{a.components[0]?.item.name}</span>
                  {a.components.length > 1 && (
                    <span className="text-[10px] text-muted-foreground"> +{a.components.length - 1} more</span>
                  )}
                </TableCell>

                {/* Unit cost — owner only */}
                {isOwner && (
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(a.unitCostPerOutput)}
                  </TableCell>
                )}

                {/* Total cost — owner only */}
                {isOwner && (
                  <TableCell className="text-right font-medium text-foreground">
                    {formatCurrency(a.totalComponentCost)}
                  </TableCell>
                )}

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
                        <DropdownMenuItem onClick={() => setSelectedAssembly(a)}>
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
      <AssemblyDetailSheet
        assembly={selectedAssembly}
        open={!!selectedAssembly}
        onClose={() => setSelectedAssembly(null)}
        isOwner={isOwner}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-lg font-semibold leading-none text-foreground">{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  )
}
