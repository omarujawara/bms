import { InventoryTable } from '@features/inventory/components/inventory-table'
import { MOCK_ITEMS } from '@features/inventory/mock-data'

export default function InventoryPage() {
  return (
    <main className="p-6">
      <InventoryTable items={MOCK_ITEMS} />
    </main>
  )
}
