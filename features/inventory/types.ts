export type Unit = {
  id: string
  name: string
  abbreviation: string
  isActive: boolean
}

export type Category = {
  id: string
  name: string
  type: 'item'
  isActive: boolean
}

export type ItemType = 'standard' | 'assembled'

export type InventoryBatch = {
  id: string
  itemId: string
  purchaseOrderId: string | null
  quantityReceivedPurchaseUnits: number
  quantityReceived: number   // base units
  quantityRemaining: number  // base units
  unitCost: number           // cost per base unit — owner-only
  receivedAt: string
}

export type Item = {
  id: string
  parentItemId: string | null
  name: string
  brand: string | null
  category: Category
  purchaseUnit: Unit
  baseUnit: Unit
  saleUnit: Unit
  purchaseToBaseFactor: number
  itemType: ItemType
  reorderLevel: number | null
  qrCode: string | null
  isActive: boolean
  createdAt: string
}

// Enriched view type — adds derived stock fields computed from batches
export type ItemWithStock = Item & {
  currentStock: number    // sum of quantityRemaining (base units)
  batches: InventoryBatch[]
  isLowStock: boolean     // currentStock < reorderLevel (false when reorderLevel is null)
  totalValue: number      // sum of (quantityRemaining * unitCost) — owner-only
}
