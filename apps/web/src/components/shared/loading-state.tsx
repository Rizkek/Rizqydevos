import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  text?: string
  className?: string
}

export function LoadingState({ text = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-[var(--color-text-muted)]", className)}>
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <p className="text-[13px] font-medium">{text}</p>
    </div>
  )
}
