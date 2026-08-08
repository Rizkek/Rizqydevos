import { ModulePlaceholder } from '@/components/shared/module-placeholder'
import { BarChart3 } from 'lucide-react'

export const metadata = { title: 'Analytics' }

export default function AnalyticsPage() {
  return (
    <ModulePlaceholder
      title="Analytics"
      description="Personal productivity insights, coding time tracker, commit frequency analysis, and project health scores."
      icon={BarChart3}
      phase="Phase 4"
    />
  )
}