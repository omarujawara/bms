import { SalesTable } from '@features/sales/components/sales-table'
import { MOCK_SALES } from '@features/sales/mock-data'

export default function SalesPage() {
  return (
    <main className="p-6">
      <SalesTable sales={MOCK_SALES} />
    </main>
  )
}
