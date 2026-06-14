import { RentalsTable } from '@features/rentals/components/rentals-table'
import { MOCK_RENTALS } from '@features/rentals/mock-data'

export default function RentalsPage() {
  return (
    <main className="p-6">
      <RentalsTable rentals={MOCK_RENTALS} />
    </main>
  )
}
