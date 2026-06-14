import { StaffTable } from '@features/staff/components/staff-table'
import { MOCK_STAFF } from '@features/staff/mock-data'

export default function StaffPage() {
  return (
    <main className="p-6">
      <StaffTable staff={MOCK_STAFF} />
    </main>
  )
}
