import { ExpensesTable } from '@features/operations/components/expenses-table'
import { MOCK_EXPENSES } from '@features/operations/mock-data'

export default function ExpensesPage() {
  return (
    <main className="p-6">
      <ExpensesTable expenses={MOCK_EXPENSES} />
    </main>
  )
}
