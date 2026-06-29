import { CustomerOrdersTable } from '@features/customer-orders/components/customer-orders-table'
import { MOCK_CUSTOMER_ORDERS } from '@features/customer-orders/mock-data'

export default function OrdersPage() {
  return (
    <main className="p-6">
      <CustomerOrdersTable orders={MOCK_CUSTOMER_ORDERS} />
    </main>
  )
}
