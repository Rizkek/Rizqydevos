'use client'

import * as React from 'react'
import { TextField } from '@/components/ui/text-field'
import type { SecondFactorKind } from '@/lib/two-factor'

interface SecondFactorFieldProps {
  kind: SecondFactorKind
  onKindChange: (kind: SecondFactorKind) => void
  value: string
  onChange: (value: string) => void
  error?: string | undefined
  autoFocus?: boolean
}

// One field for the second sign-in step, shared by the sign-in page and the password confirmation dialog.
export const SecondFactorField = React.forwardRef<HTMLInputElement, SecondFactorFieldProps>(function SecondFactorField(
  { kind, onKindChange, value, onChange, error, autoFocus },
  ref,
) {
  const isTotp = kind === 'totp'
  return (
    <div className="flex flex-col gap-2">
      <TextField
        ref={ref}
        label={isTotp ? 'Authenticator code' : 'Backup code'}
        hint={isTotp ? 'The 6-digit code from your authenticator app.' : 'One of the backup codes you saved when you turned on two-factor sign-in. Each works once.'}
        autoComplete="one-time-code"
        inputMode={isTotp ? 'numeric' : 'text'}
        autoFocus={autoFocus}
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
      />
      <button
        type="button"
        onClick={() => {
          onChange('')
          onKindChange(isTotp ? 'backup' : 'totp')
        }}
        className="self-start text-[13px] font-medium text-[var(--color-accent-text)] underline-offset-2 hover:underline"
      >
        {isTotp ? 'Use a backup code instead' : 'Use an authenticator code instead'}
      </button>
    </div>
  )
})
