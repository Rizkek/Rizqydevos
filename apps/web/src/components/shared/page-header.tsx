import * as React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">{title}</h1>
        {description && (
          <p className="text-[13px] text-[var(--color-text-2)] mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
