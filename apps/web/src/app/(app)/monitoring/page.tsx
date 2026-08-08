import { ModulePlaceholder } from '@/components/shared/module-placeholder'
import { Activity } from 'lucide-react'

export const metadata = { title: 'Monitoring' }

export default function MonitoringPage() {
  return (
    <ModulePlaceholder
      title="Monitoring"
      description="Real-time server metrics, uptime tracking, error rates, latency charts, and alerting rules."
      icon={Activity}
      phase="Phase 3"
    />
  )
}