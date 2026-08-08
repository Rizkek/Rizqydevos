import * as React from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { LucideIcon, Rocket } from 'lucide-react'

interface ModulePlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
  phase: string
}

export function ModulePlaceholder({ title, description, icon: Icon, phase }: ModulePlaceholderProps) {
  return (
    <div className="p-[var(--spacing-page-pad)] max-w-[1400px] mx-auto w-full h-full flex flex-col">
      <PageHeader 
        title={title} 
        description={description}
      />
      
      <div className="flex-1 flex items-center justify-center pb-24">
        <Card className="max-w-md p-10 flex flex-col items-center text-center border-dashed border-2 border-[var(--color-border-strong)] bg-transparent shadow-none">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-6 text-[var(--color-accent)]">
            <Icon size={32} />
          </div>
          <h2 className="text-[20px] font-bold text-[var(--color-text)] mb-3 tracking-tight">
            Coming Soon in {phase}
          </h2>
          <p className="text-[14px] text-[var(--color-text-2)] mb-8 leading-relaxed max-w-sm">
            This module is currently under development. It will provide advanced capabilities for your personal operating system.
          </p>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-4 py-2 rounded-full uppercase tracking-wider">
            <Rocket size={14} /> DevOS Roadmap
          </div>
        </Card>
      </div>
    </div>
  )
}
