import type { AssemblyOrder, AssemblyOrderWithTotals } from './types'

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const RAW_ORDERS: AssemblyOrder[] = [
  {
    id: 'as-001',
    assemblyRef: 'AS-001',
    outputItem: { id: 'item-6', name: 'Reinforced Column 200mm', brand: null, saleUnitAbbreviation: 'pc' },
    quantityProduced: 8,
    assembledDate: daysAgo(40),
    notes: 'Standard column run for stock',
    createdByName: 'Lamin Touray',
    components: [
      {
        id: 'ac-1a',
        assemblyOrderId: 'as-001',
        item: { id: 'item-1', name: 'OPC Cement', brand: 'Dangote', baseUnitAbbreviation: 'kg' },
        quantityUsed: 400,
        unitCostFifo: 450,
        allocations: [
          { id: 'aca-1a1', batchId: 'b-1a', quantity: 400, unitCost: 450 },
        ],
      },
      {
        id: 'ac-1b',
        assemblyOrderId: 'as-001',
        item: { id: 'item-3', name: 'Steel Rod 12mm', brand: 'ISCOR', baseUnitAbbreviation: 'rod' },
        quantityUsed: 32,
        unitCostFifo: 3500,
        allocations: [
          { id: 'aca-1b1', batchId: 'b-3a', quantity: 32, unitCost: 3500 },
        ],
      },
      {
        id: 'ac-1c',
        assemblyOrderId: 'as-001',
        item: { id: 'item-7', name: 'GI Binding Wire', brand: 'Stallion', baseUnitAbbreviation: 'kg' },
        quantityUsed: 16,
        unitCostFifo: 380,
        allocations: [
          { id: 'aca-1c1', batchId: 'b-7a', quantity: 16, unitCost: 380 },
        ],
      },
    ],
  },
  {
    id: 'as-002',
    assemblyRef: 'AS-002',
    outputItem: { id: 'item-9', name: 'Precast Lintel 1.2m', brand: null, saleUnitAbbreviation: 'pc' },
    quantityProduced: 12,
    assembledDate: daysAgo(18),
    notes: null,
    createdByName: 'Awa Sanneh',
    components: [
      {
        id: 'ac-2a',
        assemblyOrderId: 'as-002',
        item: { id: 'item-1', name: 'OPC Cement', brand: 'Dangote', baseUnitAbbreviation: 'kg' },
        quantityUsed: 300,
        unitCostFifo: 468,
        allocations: [
          { id: 'aca-2a1', batchId: 'b-1a', quantity: 100, unitCost: 450 },
          { id: 'aca-2a2', batchId: 'b-1b', quantity: 200, unitCost: 480 },
        ],
      },
      {
        id: 'ac-2b',
        assemblyOrderId: 'as-002',
        item: { id: 'item-5', name: 'Granite Gravel ¾"', brand: null, baseUnitAbbreviation: 'kg' },
        quantityUsed: 600,
        unitCostFifo: 22,
        allocations: [
          { id: 'aca-2b1', batchId: 'b-5a', quantity: 600, unitCost: 22 },
        ],
      },
      {
        id: 'ac-2c',
        assemblyOrderId: 'as-002',
        item: { id: 'item-3', name: 'Steel Rod 12mm', brand: 'ISCOR', baseUnitAbbreviation: 'rod' },
        quantityUsed: 24,
        unitCostFifo: 3650,
        allocations: [
          { id: 'aca-2c1', batchId: 'b-3a', quantity: 13, unitCost: 3500 },
          { id: 'aca-2c2', batchId: 'b-3b', quantity: 11, unitCost: 3800 },
        ],
      },
    ],
  },
  {
    id: 'as-003',
    assemblyRef: 'AS-003',
    outputItem: { id: 'item-10', name: 'Mortar Mix Bag (premixed)', brand: null, saleUnitAbbreviation: 'bag' },
    quantityProduced: 50,
    assembledDate: daysAgo(4),
    notes: 'Premix run from surplus sand and cement',
    createdByName: 'Lamin Touray',
    components: [
      {
        id: 'ac-3a',
        assemblyOrderId: 'as-003',
        item: { id: 'item-1', name: 'OPC Cement', brand: 'Dangote', baseUnitAbbreviation: 'kg' },
        quantityUsed: 500,
        unitCostFifo: 480,
        allocations: [
          { id: 'aca-3a1', batchId: 'b-1b', quantity: 500, unitCost: 480 },
        ],
      },
      {
        id: 'ac-3b',
        assemblyOrderId: 'as-003',
        item: { id: 'item-2', name: 'Fine Sand', brand: null, baseUnitAbbreviation: 'kg' },
        quantityUsed: 1500,
        unitCostFifo: 18,
        allocations: [
          { id: 'aca-3b1', batchId: 'b-2b', quantity: 1500, unitCost: 18 },
        ],
      },
    ],
  },
]

function buildWithTotals(o: AssemblyOrder): AssemblyOrderWithTotals {
  const totalComponentCost = o.components.reduce(
    (s, c) => s + c.quantityUsed * c.unitCostFifo, 0
  )
  return {
    ...o,
    totalComponentCost,
    unitCostPerOutput: o.quantityProduced === 0 ? 0 : totalComponentCost / o.quantityProduced,
  }
}

export const MOCK_ASSEMBLIES: AssemblyOrderWithTotals[] = RAW_ORDERS.map(buildWithTotals)
