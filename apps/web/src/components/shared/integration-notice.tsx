import * as React from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { describeIntegrationError, type IntegrationProvider } from '@/lib/integrations'

interface IntegrationNoticeProps {
  error: unknown
  provider: IntegrationProvider
  onRetry: () => void
  className?: string
}

export function IntegrationNotice({ error, provider, onRetry, className }: IntegrationNoticeProps) {
  const issue = describeIntegrationError(error, provider)

  return (
    <div role="status" className={cn('flex flex-col items-center justify-center gap-3 p-4 text-center text-[13px] text-[var(--color-text-2)]', className)}>
      <AlertCircle size={20} aria-hidden="true" />
      <p>{issue.message}</p>
      {issue.kind === 'rate-limited' && issue.retryAfter !== undefined && (
        <p>Try again in {Math.max(1, Math.ceil(issue.retryAfter))} seconds.</p>
      )}
      {issue.action === 'settings' ? (
        <Button asChild variant="outline" size="sm">
          <Link href="/settings">Open Settings</Link>
        </Button>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
