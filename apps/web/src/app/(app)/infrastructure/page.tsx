import { DeploymentsPanel } from '@/components/infrastructure/deployments-panel'
import { SitesPanel } from '@/components/infrastructure/sites-panel'

export default function InfrastructurePage() {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Infrastructure</h1>
        <p className="text-[14px] text-[var(--color-text-2)] mt-1">Vercel deployments, and uptime and SSL expiry of your sites</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 h-full">
        <DeploymentsPanel />
        <SitesPanel />
      </div>
    </div>
  )
}
