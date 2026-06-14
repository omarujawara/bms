'use client'

import { Package, ArrowDown } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { formatCurrency, formatStock } from '@utils/format'
import type { AssemblyOrderWithTotals } from '../types'

interface AssemblyDetailSheetProps {
  assembly: AssemblyOrderWithTotals | null
  open: boolean
  onClose: () => void
  isOwner: boolean
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-medium text-foreground mb-2">{children}</h3>
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function AssemblyDetailSheet({ assembly, open, onClose, isOwner }: AssemblyDetailSheetProps) {
  if (!assembly) return null

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col overflow-y-auto">

        {/* Header */}
        <SheetHeader className="border-b border-border pb-4">
          <div className="pr-8">
            <SheetTitle>{assembly.assemblyRef}</SheetTitle>
            <SheetDescription>
              Assembled {formatDate(assembly.assembledDate)} · by {assembly.createdByName}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6 flex-1">

          {/* Output */}
          <section>
            <SectionHeader>Produced</SectionHeader>
            <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Package className="size-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{assembly.outputItem.name}</div>
                {assembly.outputItem.brand && (
                  <div className="text-[10px] text-muted-foreground">{assembly.outputItem.brand}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">
                  {formatStock(assembly.quantityProduced)} {assembly.outputItem.saleUnitAbbreviation}
                </div>
                {isOwner && (
                  <div className="text-[10px] text-muted-foreground">
                    {formatCurrency(assembly.unitCostPerOutput)}/{assembly.outputItem.saleUnitAbbreviation}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Consumed-from divider */}
          <div className="flex items-center justify-center -my-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <ArrowDown className="size-3" />
              consumed from
            </div>
          </div>

          {/* Components */}
          <section>
            <SectionHeader>
              Components
              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                ({assembly.components.length})
              </span>
            </SectionHeader>
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Item</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Used</th>
                    {isOwner && (
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Unit Cost</th>
                    )}
                    {isOwner && (
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Line Cost</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {assembly.components.map(c => (
                    <tr key={c.id} className="border-b border-border/40 last:border-0">
                      <td className="px-3 py-2">
                        <div className="font-medium text-foreground">{c.item.name}</div>
                        {c.item.brand && (
                          <div className="text-[10px] text-muted-foreground">{c.item.brand}</div>
                        )}
                        {/* Batch allocations — owner-only */}
                        {isOwner && c.allocations.length > 1 && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {c.allocations.length} batches
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-foreground">
                        {formatStock(c.quantityUsed)} {c.item.baseUnitAbbreviation}
                      </td>
                      {isOwner && (
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {formatCurrency(c.unitCostFifo)}
                        </td>
                      )}
                      {isOwner && (
                        <td className="px-3 py-2 text-right font-medium text-foreground">
                          {formatCurrency(c.quantityUsed * c.unitCostFifo)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
              Components are drawn from inventory via FIFO at the time of assembly.
            </p>
          </section>

          {/* Cost rollup — owner only */}
          {isOwner && (
            <section>
              <SectionHeader>
                Cost Rollup
                <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(owner only)</span>
              </SectionHeader>
              <div className="rounded-lg border border-border/60 px-3 py-1">
                <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                  <span className="text-xs text-muted-foreground">Total component cost</span>
                  <span className="text-xs text-foreground">{formatCurrency(assembly.totalComponentCost)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                  <span className="text-xs text-muted-foreground">Units produced</span>
                  <span className="text-xs text-foreground">
                    {formatStock(assembly.quantityProduced)} {assembly.outputItem.saleUnitAbbreviation}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 font-medium">
                  <span className="text-xs text-muted-foreground">Cost per unit</span>
                  <span className="text-xs font-semibold text-foreground">
                    {formatCurrency(assembly.unitCostPerOutput)}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                This per-unit cost becomes the FIFO cost of the produced item&apos;s new stock batch.
              </p>
            </section>
          )}

          {assembly.notes && (
            <section>
              <SectionHeader>Notes</SectionHeader>
              <p className="text-xs text-muted-foreground leading-relaxed rounded-lg border border-border/60 px-3 py-2">
                {assembly.notes}
              </p>
            </section>
          )}

        </div>
      </SheetContent>
    </Sheet>
  )
}
