'use client'

import { QrCode, Package } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { formatCurrency, formatStock } from '@utils/format'
import type { ItemWithStock } from '../types'

interface ItemDetailSheetProps {
  item: ItemWithStock | null
  open: boolean
  onClose: () => void
  isOwner: boolean
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0 w-36">{label}</span>
      <span className="text-xs text-foreground text-right">{value}</span>
    </div>
  )
}

export function ItemDetailSheet({ item, open, onClose, isOwner }: ItemDetailSheetProps) {
  if (!item) return null

  const activeBatches = item.batches.filter(b => b.quantityRemaining > 0)

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-md w-full flex flex-col overflow-y-auto">
        {/* Header */}
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start gap-2 pr-8">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-sm font-semibold leading-tight">{item.name}</SheetTitle>
              {item.brand && (
                <SheetDescription className="mt-0.5">{item.brand}</SheetDescription>
              )}
            </div>
            <div className="flex flex-col gap-1 items-end shrink-0">
              <Badge variant={item.isActive ? 'default' : 'outline'}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant={item.itemType === 'assembled' ? 'secondary' : 'outline'}>
                {item.itemType === 'assembled' ? 'Assembled' : 'Standard'}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6 flex-1">

          {/* Item Details */}
          <section>
            <h3 className="text-xs font-medium text-foreground mb-2">Item Details</h3>
            <div className="rounded-lg border border-border/60 px-3 py-1">
              <DetailRow label="Category" value={item.category.name} />
              <DetailRow
                label="Purchase unit"
                value={
                  item.purchaseUnit.id === item.baseUnit.id
                    ? item.purchaseUnit.name
                    : `${item.purchaseUnit.name} → ${item.baseUnit.name} (×${item.purchaseToBaseFactor})`
                }
              />
              <DetailRow label="Sale unit" value={item.saleUnit.name} />
              <DetailRow
                label="Reorder level"
                value={
                  item.reorderLevel !== null
                    ? `${formatStock(item.reorderLevel)} ${item.baseUnit.abbreviation}`
                    : <span className="text-muted-foreground">Not set</span>
                }
              />
              <DetailRow
                label="QR code"
                value={
                  item.qrCode
                    ? (
                      <span className="flex items-center gap-1">
                        <QrCode className="size-3 text-muted-foreground" />
                        {item.qrCode}
                      </span>
                    )
                    : <span className="text-muted-foreground">Not generated</span>
                }
              />
            </div>
          </section>

          {/* Stock Summary */}
          <section>
            <h3 className="text-xs font-medium text-foreground mb-2">Current Stock</h3>
            <div className="rounded-lg border border-border/60 px-3 py-1">
              <DetailRow
                label="On hand"
                value={
                  <span className={item.isLowStock ? 'text-destructive font-medium' : ''}>
                    {formatStock(item.currentStock)} {item.baseUnit.abbreviation}
                    {item.isLowStock && (
                      <span className="ml-1.5 text-destructive text-[10px]">LOW</span>
                    )}
                  </span>
                }
              />
              {isOwner && (
                <DetailRow
                  label="Total value"
                  value={formatCurrency(item.totalValue)}
                />
              )}
              <DetailRow
                label="Batches"
                value={`${activeBatches.length} active / ${item.batches.length} total`}
              />
            </div>
          </section>

          {/* Batch Breakdown — owner only */}
          {isOwner && item.batches.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-foreground mb-2">
                Batch Breakdown
                <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(owner only)</span>
              </h3>
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Received</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Remaining</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.batches.map((batch, i) => (
                      <tr
                        key={batch.id}
                        className={`border-b border-border/40 last:border-0 ${batch.quantityRemaining === 0 ? 'opacity-40' : ''}`}
                      >
                        <td className="px-3 py-2 text-foreground">
                          {new Date(batch.receivedAt).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {formatStock(batch.quantityReceived)} {item.baseUnit.abbreviation}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={batch.quantityRemaining === 0 ? 'text-muted-foreground' : 'text-foreground'}>
                            {formatStock(batch.quantityRemaining)} {item.baseUnit.abbreviation}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">
                          {formatCurrency(batch.unitCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Empty state for no batches */}
          {item.batches.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Package className="size-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No stock received yet</p>
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  )
}
