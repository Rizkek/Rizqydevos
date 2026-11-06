'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { PasswordField } from '@/components/ui/text-field'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ApiError } from '@/lib/api'
import { SecondFactorField } from '@/components/auth/second-factor-field'
import { signIn, useSession } from '@/lib/auth-client'
import { needsSecondFactor, verifySecondFactor, type SecondFactorKind } from '@/lib/two-factor'

export function isReauthRequired(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'REAUTH_REQUIRED'
}

interface ReauthDialogProps {
  open: boolean
  onConfirmed: () => void
  onCancel: () => void
}

// Signing in again creates a fresh session, which the API accepts for revealing and exporting secrets.
// With two-factor sign-in on, the password is followed by a code, exactly like the sign-in page.
function ReauthDialog({ open, onConfirmed, onCancel }: ReauthDialogProps) {
  const { data: session } = useSession()
  const [password, setPassword] = React.useState('')
  const [step, setStep] = React.useState<'password' | 'code'>('password')
  const [codeKind, setCodeKind] = React.useState<SecondFactorKind>('totp')
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState<string | undefined>()
  const [pending, setPending] = React.useState(false)

  const reset = () => {
    setPassword('')
    setCode('')
    setCodeKind('totp')
    setStep('password')
    setError(undefined)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const email = session?.user.email
    if (pending || !email) return
    if (step === 'password' && !password) {
      setError('Enter your password.')
      return
    }
    setPending(true)
    try {
      if (step === 'code') {
        const problem = await verifySecondFactor(codeKind, code)
        if (problem) {
          setError(problem)
          return
        }
      } else {
        const { data, error: signInError } = await signIn.email({ email, password })
        if (signInError) {
          setError('Wrong password. Try again.')
          return
        }
        if (needsSecondFactor(data)) {
          setPassword('')
          setError(undefined)
          setStep('code')
          return
        }
      }
      reset()
      onConfirmed()
    } finally {
      setPending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) { reset(); onCancel() } }}>
      <SheetContent className="p-6">
        <SheetTitle className="mb-2 text-[15px] font-semibold text-[var(--color-text)]">{step === 'code' ? 'Enter your code' : 'Confirm your password'}</SheetTitle>
        <p className="mb-4 text-[13px] text-[var(--color-text-2)]">
          Revealing or exporting secrets needs a password entered in the last 15 minutes.
        </p>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          {step === 'code' ? (
            <SecondFactorField kind={codeKind} onKindChange={setCodeKind} value={code} onChange={setCode} error={error} autoFocus />
          ) : (
            <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} autoComplete="current-password" autoFocus />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { reset(); onCancel() }}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Checking…' : 'Confirm'}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

interface PendingAction {
  action: () => Promise<void>
  onError: (error: unknown) => void
}

// Runs an action; when the API asks for a recent sign-in, asks for the password and runs the action again.
// Any other error, also from the second attempt, goes to onError.
export function useReauth() {
  const [pending, setPending] = React.useState<PendingAction | null>(null)

  const run = React.useCallback(async (action: () => Promise<void>, onError: (error: unknown) => void) => {
    try {
      await action()
    } catch (error) {
      if (isReauthRequired(error)) setPending({ action, onError })
      else onError(error)
    }
  }, [])

  const dialog = (
    <ReauthDialog
      open={pending !== null}
      onCancel={() => setPending(null)}
      onConfirmed={() => {
        const retry = pending
        setPending(null)
        if (retry) void run(retry.action, retry.onError)
      }}
    />
  )

  return { run, dialog }
}
