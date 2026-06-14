import { PayrollTable } from '@features/payroll/components/payroll-table'
import { MOCK_PAYROLL_PERIODS, MOCK_PENDING_ADJUSTMENTS } from '@features/payroll/mock-data'

export default function PayrollPage() {
  return (
    <main className="p-6">
      <PayrollTable
        periods={MOCK_PAYROLL_PERIODS}
        pendingAdjustments={MOCK_PENDING_ADJUSTMENTS}
      />
    </main>
  )
}
