import { DashboardOverview } from '@features/dashboard/components/dashboard-overview'
import {
  MOCK_ACTIVITY,
  MOCK_ALERTS,
  MOCK_METRICS,
  MOCK_REVENUE_TREND,
} from '@features/dashboard/mock-data'

export default function DashboardPage() {
  return (
    <main className="p-6">
      <DashboardOverview
        metrics={MOCK_METRICS}
        alerts={MOCK_ALERTS}
        revenueTrend={MOCK_REVENUE_TREND}
        activity={MOCK_ACTIVITY}
      />
    </main>
  )
}
