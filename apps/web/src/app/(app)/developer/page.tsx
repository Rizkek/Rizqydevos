import { ModulePlaceholder } from '@/components/shared/module-placeholder'
import { TerminalSquare } from 'lucide-react'

export const metadata = { title: 'Developer Tools' }

export default function DeveloperPage() {
  return (
    <ModulePlaceholder
      title="Developer Tools"
      description="GitHub integration, repositories, API explorer, Docker management, SSH sessions, and log viewer."
      icon={TerminalSquare}
      phase="Phase 2"
    />
  )
}