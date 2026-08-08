import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 border border-dashed border-[var(--color-border-strong)] rounded-[var(--radius-lg)] bg-[var(--color-surface)]/50", className)}>
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--color-surface-2)] mb-4 text-[var(--color-text-muted)]">
        <Icon size={24} />
      </div>
      <h3 className="text-[14px] font-semibold text-[var(--color-text)] mb-1">{title}</h3>
      <p className="text-[13px] text-[var(--color-text-2)] mb-6 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
