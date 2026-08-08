import * as React from 'react'
import { MoreVertical, Maximize2, X, GripHorizontal } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/stores/widget.store'
import type { WidgetType } from '@devos/types'

interface WidgetCardProps {
  id: string
  type: WidgetType
  title: string
  children: React.ReactNode
  className?: string
  contentClassName?: string
  headerAction?: React.ReactNode
}

export function WidgetCard({ id, type, title, children, className, contentClassName, headerAction }: WidgetCardProps) {
  const toggleWidget = useWidgetStore((state) => state.toggleWidget)
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <Card 
      className={cn("h-full flex flex-col overflow-hidden transition-shadow duration-200 group relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag handle overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 transition-opacity z-10 text-[var(--color-text-muted)]">
        <GripHorizontal size={14} />
      </div>

      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-[var(--color-border-subtle)] shrink-0 bg-[var(--color-surface-2)]/30">
        <CardTitle className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-2)]">
          {title}
        </CardTitle>
        <div className="flex items-center gap-1">
          {headerAction}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-[var(--radius-sm)]">
                <MoreVertical size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 z-[var(--z-dropdown)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] rounded-[var(--radius-md)] p-1 shadow-[var(--shadow-md)] text-[13px] text-[var(--color-text)]">
              <DropdownMenuItem className="flex items-center gap-2 px-2 py-1.5 cursor-default hover:bg-[var(--color-surface-3)] rounded-[var(--radius-sm)] outline-none">
                <Maximize2 size={14} /> Expand
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleWidget(type)}
                className="flex items-center gap-2 px-2 py-1.5 cursor-default hover:bg-[var(--color-danger-muted)] hover:text-[var(--color-danger)] rounded-[var(--radius-sm)] outline-none text-[var(--color-danger)]"
              >
                <X size={14} /> Hide Widget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className={cn("flex-1 p-0 overflow-hidden flex flex-col relative", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
