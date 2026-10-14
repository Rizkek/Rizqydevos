import * as React from 'react'
import { Card } from '@/components/ui/card'

interface AuthShellProps {
  title: string
  description?: string
  children?: React.ReactNode
}

// Shared frame for the sign-in, password reset, and new password screens. Flat on purpose: no animated backdrop.
export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main id="main" className="min-h-dvh flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <Card className="w-full max-w-md p-6 sm:p-8 flex flex-col gap-6 bg-[var(--color-surface)]">
        <header className="flex flex-col gap-3">
          <div
            aria-hidden="true"
            className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--color-accent)] flex items-center justify-center text-[16px] font-bold text-[var(--color-on-solid)]"
          >
            D
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">{title}</h1>
            {description && <p className="mt-1 text-[14px] text-[var(--color-text-2)]">{description}</p>}
          </div>
        </header>
        {children}
      </Card>
    </main>
  )
}
