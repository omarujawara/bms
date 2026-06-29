'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, AlertTriangle, Package, MoreHorizontal, Eye, Pencil, PowerOff } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatStock } from '@utils/format'
import { ItemDetailSheet } from './item-detail-sheet'
import type { ItemWithStock } from '../types'

// TODO: replace with session user role once auth is wired (read from server session)
const CURRENT_ROLE: 'owner' | 'sales_rep' = 'owner'

interface InventoryTableProps {
  items: ItemWithStock[]
}

export function InventoryTable({ items }: InventoryTableProps) {
  const isOwner = CURRENT_ROLE === 'owner'

  const [search, setSearch]               = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter]       = useState('all')
  const [statusFilter, setStatusFilter]   = useState('all')
  const [selectedItem, setSelectedItem]   = useState<ItemWithStock | null>(null)

  // Unique category names for the filter dropdown
  const categories = useMemo(
    () => Array.from(new Set(items.map(i => i.category.name))).sort(),
    [items]
  )

  // Filtered rows
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(item => {
      if (q && !item.name.toLowerCase().includes(q) && !item.brand?.toLowerCase().includes(q)) return false
      if (categoryFilter !== 'all' && item.category.name !== categoryFilter) return false
      if (typeFilter !== 'all' && item.itemType !== typeFilter) return false
      if (statusFilter === 'active'    && !item.isActive)   return false
      if (statusFilter === 'inactive'  && item.isActive)    return false
      if (statusFilter === 'low_stock' && !item.isLowStock) return false
      return true
    })
  }, [items, search, categoryFilter, typeFilter, statusFilter])

  // Stats computed from all items (not filtered)
  const stats = useMemo(() => ({
    totalSkus:   items.length,
    inStock:     items.filter(i => i.isActive && i.currentStock > 0).length,
    lowStock:    items.filter(i => i.isActive && i.isLowStock).length,
    totalValue:  items.reduce((sum, i) => sum + i.totalValue, 0),
  }), [items])

  return (
    <div className="flex flex-col gap-5">

      {/* ── Page header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Inventory</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            All items, stock levels, and batch information
          </p>
        </div>
        {isOwner && (
          // TODO: open Add Item dialog
          <Button size="sm">
            <Plus />
            Add Item
          </Button>
        )}
      </div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className={`grid gap-3 ${isOwner ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <StatCard label="Total SKUs" value={stats.totalSkus.toString()} />
        <StatCard
          label="In Stock"
          value={stats.inStock.toString()}
          sub={`of ${stats.totalSkus} active`}
        />
        <StatCard
          label="Low Stock"
          value={stats.lowStock.toString()}
          valueClass={stats.lowStock > 0 ? 'text-destructive' : undefined}
          icon={stats.lowStock > 0 ? <AlertTriangle className="size-3.5 text-destructive" /> : undefined}
        />
        {isOwner && (
          <StatCard
            label="Total Value"
            value={formatCurrency(stats.totalValue)}
            sub="owner only"
          />
        )}
      </div>

      {/* ── Filter toolbar ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search items..."
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

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="min-w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="assembled">Assembled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="min-w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="low_stock">Low stock</SelectItem>
          </SelectContent>
        </Select>

        {(search || categoryFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('')
              setCategoryFilter('all')
              setTypeFilter('all')
              setStatusFilter('all')
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4 w-64">Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              {isOwner && <TableHead className="text-right">Unit Cost</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={isOwner ? 7 : 6} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Package className="size-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No items match your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.map(item => {
              // FIFO unit cost = cost from the oldest batch with remaining stock
              const oldestActiveBatch = item.batches
                .filter(b => b.quantityRemaining > 0)
                .sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime())[0]

              return (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Item name + brand */}
                  <TableCell className="pl-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{item.name}</span>
                      {item.brand && (
                        <span className="text-muted-foreground text-[10px] mt-0.5">{item.brand}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="text-muted-foreground">{item.category.name}</TableCell>

                  {/* Type badge */}
                  <TableCell>
                    <Badge variant={item.itemType === 'assembled' ? 'secondary' : 'outline'}>
                      {item.itemType === 'assembled' ? 'Assembled' : 'Standard'}
                    </Badge>
                  </TableCell>

                  {/* Stock */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.isLowStock && (
                        <AlertTriangle className="size-3 text-destructive shrink-0" />
                      )}
                      <span className={item.isLowStock ? 'text-destructive font-medium' : 'text-foreground'}>
                        {formatStock(item.currentStock)} {item.baseUnit.abbreviation}
                      </span>
                    </div>
                    {item.reorderLevel !== null && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 text-right">
                        min {formatStock(item.reorderLevel)} {item.baseUnit.abbreviation}
                      </div>
                    )}
                  </TableCell>

                  {/* Unit Cost — owner only */}
                  {isOwner && (
                    <TableCell className="text-right">
                      {oldestActiveBatch
                        ? (
                          <span className="text-foreground">
                            {formatCurrency(oldestActiveBatch.unitCost)}/{item.baseUnit.abbreviation}
                          </span>
                        )
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                  )}

                  {/* Status badge */}
                  <TableCell>
                    <Badge variant={item.isActive ? 'default' : 'outline'}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>

                  {/* Row actions */}
                  <TableCell>
                    <div onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon" />}
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="bottom">
                          <DropdownMenuItem onClick={() => setSelectedItem(item)}>
                            <Eye />
                            View details
                          </DropdownMenuItem>
                          {isOwner && (
                            <>
                              <DropdownMenuItem>
                                <Pencil />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive">
                                <PowerOff />
                                {item.isActive ? 'Deactivate' : 'Reactivate'}
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

        {filtered.length > 0 && (
          <div className="border-t border-border bg-muted/20 px-4 py-2 text-[10px] text-muted-foreground">
            Showing {filtered.length} of {items.length} items
          </div>
        )}
      </div>

      {/* ── Item detail sheet ─────────────────────────────────── */}
      <ItemDetailSheet
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        isOwner={isOwner}
      />
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  valueClass,
  icon,
}: {
  label: string
  value: string
  sub?: string
  valueClass?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className={`text-lg font-semibold text-foreground leading-none ${valueClass ?? ''}`}>
          {value}
        </span>
      </div>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  )
}
