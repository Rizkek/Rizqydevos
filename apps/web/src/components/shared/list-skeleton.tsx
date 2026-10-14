import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ListSkeletonProps {
  label: string
  rows?: number
  className?: string
}

export function ListSkeleton({ label, rows = 3, className }: ListSkeletonProps) {
  return (
    <div role="status" className={cn('flex flex-col gap-2', className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} aria-hidden="true" className="h-10 w-full" />
      ))}
    </div>
  )
}
