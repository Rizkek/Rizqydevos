import { PageHeader } from '@/components/shared/page-header'
import { WidgetGrid } from '@/components/dashboard/widget-grid'

export const metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  
  return (
    <div className="p-[var(--spacing-page-pad)] max-w-[1400px] mx-auto w-full h-full flex flex-col">
      <PageHeader 
        title="Mission Control" 
        description={`Welcome back, Engineer. It's ${date}.`}
      />
      <div className="flex-1 overflow-y-auto pb-12">
        <WidgetGrid />
      </div>
    </div>
  )
}
