import type { Category, InventoryBatch, Item, ItemWithStock, Unit } from './types'

// ─── Units ────────────────────────────────────────────────────

const UNITS: Record<string, Unit> = {
  bag:   { id: 'u-bag',   name: 'Bag',      abbreviation: 'bag',  isActive: true },
  kg:    { id: 'u-kg',    name: 'Kilogram',  abbreviation: 'kg',   isActive: true },
  tonne: { id: 'u-tonne', name: 'Tonne',     abbreviation: 't',    isActive: true },
  piece: { id: 'u-pc',    name: 'Piece',     abbreviation: 'pc',   isActive: true },
  rod:   { id: 'u-rod',   name: 'Rod',       abbreviation: 'rod',  isActive: true },
  bundle:{ id: 'u-bndl',  name: 'Bundle',    abbreviation: 'bndl', isActive: true },
  roll:  { id: 'u-roll',  name: 'Roll',      abbreviation: 'roll', isActive: true },
  sheet: { id: 'u-sht',   name: 'Sheet',     abbreviation: 'sht',  isActive: true },
  metre: { id: 'u-m',     name: 'Metre',     abbreviation: 'm',    isActive: true },
}

// ─── Categories ───────────────────────────────────────────────

const CATEGORIES: Record<string, Category> = {
  cement:    { id: 'c1', name: 'Cement & Concrete', type: 'item', isActive: true },
  steel:     { id: 'c2', name: 'Steel & Metal',     type: 'item', isActive: true },
  aggregate: { id: 'c3', name: 'Aggregates',         type: 'item', isActive: true },
  masonry:   { id: 'c4', name: 'Masonry',            type: 'item', isActive: true },
  timber:    { id: 'c5', name: 'Timber & Board',     type: 'item', isActive: true },
  assembled: { id: 'c6', name: 'Pre-Assembled',      type: 'item', isActive: true },
}

// ─── Raw items (without derived stock fields) ─────────────────

const RAW_ITEMS: Item[] = [
  {
    id: 'item-1',
    parentItemId: null,
    name: 'OPC Cement',
    brand: 'Dangote',
    category: CATEGORIES.cement,
    purchaseUnit: UNITS.bag,
    baseUnit: UNITS.kg,
    saleUnit: UNITS.bag,
    purchaseToBaseFactor: 50,
    itemType: 'standard',
    reorderLevel: 1000,
    qrCode: 'QR-CEMENT-OPC-001',
    isActive: true,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    id: 'item-2',
    parentItemId: null,
    name: 'Fine Sand',
    brand: null,
    category: CATEGORIES.aggregate,
    purchaseUnit: UNITS.tonne,
    baseUnit: UNITS.kg,
    saleUnit: UNITS.kg,
    purchaseToBaseFactor: 1000,
    itemType: 'standard',
    reorderLevel: 2000,
    qrCode: null,
    isActive: true,
    createdAt: '2024-01-10T08:30:00Z',
  },
  {
    id: 'item-3',
    parentItemId: null,
    name: 'Steel Rod 12mm',
    brand: 'ISCOR',
    category: CATEGORIES.steel,
    purchaseUnit: UNITS.bundle,
    baseUnit: UNITS.rod,
    saleUnit: UNITS.rod,
    purchaseToBaseFactor: 10,
    itemType: 'standard',
    reorderLevel: 60,
    qrCode: 'QR-STEEL-12MM-001',
    isActive: true,
    createdAt: '2024-01-11T09:00:00Z',
  },
  {
    id: 'item-4',
    parentItemId: null,
    name: 'Hollow Block 6"',
    brand: null,
    category: CATEGORIES.masonry,
    purchaseUnit: UNITS.piece,
    baseUnit: UNITS.piece,
    saleUnit: UNITS.piece,
    purchaseToBaseFactor: 1,
    itemType: 'standard',
    reorderLevel: 500,
    qrCode: null,
    isActive: true,
    createdAt: '2024-01-12T10:00:00Z',
  },
  {
    id: 'item-5',
    parentItemId: null,
    name: 'Granite Gravel ¾"',
    brand: null,
    category: CATEGORIES.aggregate,
    purchaseUnit: UNITS.tonne,
    baseUnit: UNITS.kg,
    saleUnit: UNITS.kg,
    purchaseToBaseFactor: 1000,
    itemType: 'standard',
    reorderLevel: 1000,
    qrCode: null,
    isActive: true,
    createdAt: '2024-01-13T08:00:00Z',
  },
  {
    id: 'item-6',
    parentItemId: null,
    name: 'Reinforced Column 200mm',
    brand: null,
    category: CATEGORIES.assembled,
    purchaseUnit: UNITS.piece,
    baseUnit: UNITS.piece,
    saleUnit: UNITS.piece,
    purchaseToBaseFactor: 1,
    itemType: 'assembled',
    reorderLevel: 5,
    qrCode: 'QR-COL-200MM-001',
    isActive: true,
    createdAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 'item-7',
    parentItemId: null,
    name: 'GI Binding Wire',
    brand: 'Stallion',
    category: CATEGORIES.steel,
    purchaseUnit: UNITS.roll,
    baseUnit: UNITS.kg,
    saleUnit: UNITS.kg,
    purchaseToBaseFactor: 30,
    itemType: 'standard',
    reorderLevel: 60,
    qrCode: null,
    isActive: true,
    createdAt: '2024-01-16T09:00:00Z',
  },
  {
    id: 'item-8',
    parentItemId: null,
    name: 'Marine Plywood ¾"',
    brand: 'Berger',
    category: CATEGORIES.timber,
    purchaseUnit: UNITS.sheet,
    baseUnit: UNITS.sheet,
    saleUnit: UNITS.sheet,
    purchaseToBaseFactor: 1,
    itemType: 'standard',
    reorderLevel: 20,
    qrCode: null,
    isActive: false,  // discontinued
    createdAt: '2024-01-08T08:00:00Z',
  },
]

// ─── Batches ──────────────────────────────────────────────────

const BATCHES: InventoryBatch[] = [
  // OPC Cement — 3 batches, total 4,500 kg remaining (reorder 1,000 ✓)
  { id: 'b-1a', itemId: 'item-1', purchaseOrderId: 'po-1', quantityReceivedPurchaseUnits: 100, quantityReceived: 5000, quantityRemaining: 2200, unitCost: 450,  receivedAt: '2024-02-01T08:00:00Z' },
  { id: 'b-1b', itemId: 'item-1', purchaseOrderId: 'po-3', quantityReceivedPurchaseUnits: 60,  quantityReceived: 3000, quantityRemaining: 1500, unitCost: 480,  receivedAt: '2024-03-15T08:00:00Z' },
  { id: 'b-1c', itemId: 'item-1', purchaseOrderId: 'po-7', quantityReceivedPurchaseUnits: 40,  quantityReceived: 2000, quantityRemaining: 800,  unitCost: 500,  receivedAt: '2024-05-02T08:00:00Z' },

  // Fine Sand — 2 batches, total 600 kg remaining (reorder 2,000 ⚠️ LOW STOCK)
  { id: 'b-2a', itemId: 'item-2', purchaseOrderId: 'po-2', quantityReceivedPurchaseUnits: 5,   quantityReceived: 5000, quantityRemaining: 0,   unitCost: 15,   receivedAt: '2024-01-20T08:00:00Z' },
  { id: 'b-2b', itemId: 'item-2', purchaseOrderId: 'po-5', quantityReceivedPurchaseUnits: 2,   quantityReceived: 2000, quantityRemaining: 600,  unitCost: 18,   receivedAt: '2024-04-10T08:00:00Z' },

  // Steel Rod 12mm — 2 batches, total 95 rods remaining (reorder 60 ✓)
  { id: 'b-3a', itemId: 'item-3', purchaseOrderId: 'po-2', quantityReceivedPurchaseUnits: 10,  quantityReceived: 100,  quantityRemaining: 45,   unitCost: 3500, receivedAt: '2024-02-10T08:00:00Z' },
  { id: 'b-3b', itemId: 'item-3', purchaseOrderId: 'po-6', quantityReceivedPurchaseUnits: 5,   quantityReceived: 50,   quantityRemaining: 50,   unitCost: 3800, receivedAt: '2024-04-22T08:00:00Z' },

  // Hollow Block 6" — 1 batch, 280 pc remaining (reorder 500 ⚠️ LOW STOCK)
  { id: 'b-4a', itemId: 'item-4', purchaseOrderId: 'po-4', quantityReceivedPurchaseUnits: 500,  quantityReceived: 500,  quantityRemaining: 280,  unitCost: 250,  receivedAt: '2024-03-01T08:00:00Z' },

  // Granite Gravel — 2 batches, total 5,000 kg remaining (reorder 1,000 ✓)
  { id: 'b-5a', itemId: 'item-5', purchaseOrderId: 'po-2', quantityReceivedPurchaseUnits: 4,   quantityReceived: 4000, quantityRemaining: 2000,  unitCost: 22,   receivedAt: '2024-02-15T08:00:00Z' },
  { id: 'b-5b', itemId: 'item-5', purchaseOrderId: 'po-8', quantityReceivedPurchaseUnits: 3,   quantityReceived: 3000, quantityRemaining: 3000,  unitCost: 25,   receivedAt: '2024-05-20T08:00:00Z' },

  // Reinforced Column — 1 batch (from assembly), 8 pc remaining (reorder 5 ✓)
  { id: 'b-6a', itemId: 'item-6', purchaseOrderId: null,   quantityReceivedPurchaseUnits: 8,   quantityReceived: 8,    quantityRemaining: 8,    unitCost: 45000, receivedAt: '2024-04-05T08:00:00Z' },

  // GI Binding Wire — 2 batches, total 45 kg remaining (reorder 60 ⚠️ LOW STOCK)
  { id: 'b-7a', itemId: 'item-7', purchaseOrderId: 'po-3', quantityReceivedPurchaseUnits: 4,   quantityReceived: 120,  quantityRemaining: 0,    unitCost: 380,  receivedAt: '2024-02-20T08:00:00Z' },
  { id: 'b-7b', itemId: 'item-7', purchaseOrderId: 'po-9', quantityReceivedPurchaseUnits: 2,   quantityReceived: 60,   quantityRemaining: 45,   unitCost: 420,  receivedAt: '2024-05-01T08:00:00Z' },

  // Marine Plywood — 0 remaining (inactive item, all sold before discontinuation)
  { id: 'b-8a', itemId: 'item-8', purchaseOrderId: 'po-1', quantityReceivedPurchaseUnits: 30,  quantityReceived: 30,   quantityRemaining: 0,    unitCost: 18500, receivedAt: '2024-01-10T08:00:00Z' },
]

// ─── Derived computation ──────────────────────────────────────

function buildItemWithStock(item: Item, allBatches: InventoryBatch[]): ItemWithStock {
  const batches = allBatches.filter(b => b.itemId === item.id)
  const currentStock = batches.reduce((sum, b) => sum + b.quantityRemaining, 0)
  const totalValue   = batches.reduce((sum, b) => sum + b.quantityRemaining * b.unitCost, 0)
  const isLowStock   = item.reorderLevel !== null && currentStock < item.reorderLevel
  return { ...item, batches, currentStock, totalValue, isLowStock }
}

export const MOCK_ITEMS: ItemWithStock[] = RAW_ITEMS.map(item =>
  buildItemWithStock(item, BATCHES)
)
