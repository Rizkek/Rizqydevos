import * as React from 'react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  text?: string
  className?: string
}

export function LoadingState({ text = 'Loading…', className }: LoadingStateProps) {
  return (
    <div role="status" className={cn('flex flex-col items-center justify-center p-12 text-[var(--color-text-2)]', className)}>
      <p className="text-[13px] font-medium">{text}</p>
    </div>
  )
}
