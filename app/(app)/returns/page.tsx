import { ReturnsTable } from '@features/returns/components/returns-table'
import { MOCK_RETURNS } from '@features/returns/mock-data'

export default function ReturnsPage() {
  return (
    <main className="p-6">
      <ReturnsTable returns={MOCK_RETURNS} />
    </main>
  )
}
