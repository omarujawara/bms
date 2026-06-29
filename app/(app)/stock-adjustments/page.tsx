import { StockAdjustmentsTable } from '@features/operations/components/stock-adjustments-table'
import { MOCK_STOCK_ADJUSTMENTS } from '@features/operations/mock-data'

export default function StockAdjustmentsPage() {
  return (
    <main className="p-6">
      <StockAdjustmentsTable adjustments={MOCK_STOCK_ADJUSTMENTS} />
    </main>
  )
}
