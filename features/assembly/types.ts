export type AssemblyComponentAllocation = {
  id: string
  batchId: string
  quantity: number    // base units drawn from this batch
  unitCost: number    // cost from this batch — owner-only
}

export type AssemblyComponent = {
  id: string
  assemblyOrderId: string
  item: {
    id: string
    name: string
    brand: string | null
    baseUnitAbbreviation: string
  }
  quantityUsed: number       // base units consumed
  unitCostFifo: number       // FIFO weighted-avg cost per base unit — OWNER ONLY
  allocations: AssemblyComponentAllocation[]  // owner-only
}

export type AssemblyOrder = {
  id: string
  assemblyRef: string        // display label e.g. "AS-001"
  outputItem: {
    id: string
    name: string
    brand: string | null
    saleUnitAbbreviation: string
  }
  quantityProduced: number
  assembledDate: string
  notes: string | null
  createdByName: string
  components: AssemblyComponent[]
}

// Enriched with derived cost. All cost fields are owner-only.
export type AssemblyOrderWithTotals = AssemblyOrder & {
  totalComponentCost: number   // sum of (quantityUsed × unitCostFifo) — owner-only
  unitCostPerOutput: number    // totalComponentCost ÷ quantityProduced — owner-only
}
