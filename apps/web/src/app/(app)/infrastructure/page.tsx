import { ModulePlaceholder } from '@/components/shared/module-placeholder'
import { ServerCrash } from 'lucide-react'

export const metadata = { title: 'Infrastructure' }

export default function InfrastructurePage() {
  return (
    <ModulePlaceholder
      title="Infrastructure"
      description="Server management, Coolify deployments, domain DNS, storage, and cloud resource overview."
      icon={ServerCrash}
      phase="Phase 2"
    />
  )
}