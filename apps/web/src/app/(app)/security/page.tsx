import { ModulePlaceholder } from '@/components/shared/module-placeholder'
import { ShieldCheck } from 'lucide-react'

export const metadata = { title: 'Security' }

export default function SecurityPage() {
  return (
    <ModulePlaceholder
      title="Security"
      description="Secrets vault (AES-256-GCM), audit logs, 2FA management, SSH key registry, and vulnerability scanner."
      icon={ShieldCheck}
      phase="Phase 3"
    />
  )
}