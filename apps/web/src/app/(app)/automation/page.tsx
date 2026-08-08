import { ModulePlaceholder } from '@/components/shared/module-placeholder'
import { Zap } from 'lucide-react'

export const metadata = { title: 'Automation' }

export default function AutomationPage() {
  return (
    <ModulePlaceholder
      title="Automation"
      description="Create multi-step workflows with triggers and actions — automate deployments, notifications, and routine tasks."
      icon={Zap}
      phase="Phase 4"
    />
  )
}