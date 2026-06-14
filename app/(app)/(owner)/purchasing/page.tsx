import { PurchaseOrdersTable } from '@features/purchasing/components/purchase-orders-table'
import { MOCK_PURCHASE_ORDERS } from '@features/purchasing/mock-data'

export default function PurchasingPage() {
  return (
    <main className="p-6">
      <PurchaseOrdersTable orders={MOCK_PURCHASE_ORDERS} />
    </main>
  )
}
