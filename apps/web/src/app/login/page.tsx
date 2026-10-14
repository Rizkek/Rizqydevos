'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PasswordField, TextField } from '@/components/ui/text-field'
import { AuthShell } from '@/components/auth/auth-shell'
import { requestPasswordReset, signIn } from '@/lib/auth-client'
import { safeRedirectPath } from '@/lib/auth-guard'

type Mode = 'signin' | 'forgot'
type Errors = Partial<Record<'email' | 'password' | 'form', string>>

// Registration is closed on purpose (single-user app); the owner account is created with `bun run --cwd apps/web create-owner`.
export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = React.useState<Mode>('signin')
  const [loading, setLoading] = React.useState(false)
  const [resetRequested, setResetRequested] = React.useState(false)
  const [errors, setErrors] = React.useState<Errors>({})
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const emailRef = React.useRef<HTMLInputElement>(null)
  const passwordRef = React.useRef<HTMLInputElement>(null)

  const switchMode = (next: Mode) => {
    setMode(next)
    setErrors({})
    setResetRequested(false)
    setPassword('')
  }

  // Keeps what the user typed and moves focus to the first field that needs attention.
  const fail = (found: Errors) => {
    setErrors(found)
    if (found.email) emailRef.current?.focus()
    else if (found.password) passwordRef.current?.focus()
  }

  const validate = (): Errors => {
    const found: Errors = {}
    if (!email.trim()) found.email = 'Enter your email address.'
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) found.email = 'Enter a valid email address, like name@example.com.'
    if (mode === 'signin' && !password) found.password = 'Enter your password.'
    return found
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return

    const found = validate()
    if (Object.keys(found).length > 0) {
      fail(found)
      return
    }

    setErrors({})
    setLoading(true)

    try {
      if (mode === 'forgot') {
        const { error } = await requestPasswordReset({ email: email.trim(), redirectTo: `${window.location.origin}/reset-password` })
        if (error) {
          fail({ form: error.message || 'Unable to request a password reset.' })
          return
        }
        setResetRequested(true)
        return
      }

      // The proxy sends unauthenticated visitors here with ?redirectTo=<original page>.
      const destination = safeRedirectPath(new URLSearchParams(window.location.search).get('redirectTo'))
      const { error } = await signIn.email({ email: email.trim(), password })
      if (error) {
        fail({ form: error.message || 'Could not sign in. Check your email and password.' })
        return
      }
      router.push(destination)
    } catch (error: unknown) {
      fail({ form: error instanceof Error ? error.message : 'Something went wrong. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (resetRequested) {
    return (
      <AuthShell title="Reset link requested">
        <p role="status" className="text-[14px] text-[var(--color-text-2)]">
          Email delivery is not set up yet. Check the server console for the reset link, then open it to choose a new password.
        </p>
        <Button type="button" onClick={() => switchMode('signin')}>
          Back to sign in
        </Button>
      </AuthShell>
    )
  }

  const isForgot = mode === 'forgot'

  return (
    <AuthShell
      title={isForgot ? 'Reset password' : 'Sign in'}
      description={isForgot ? 'Enter your email to request a reset link.' : 'Welcome back to DevOS.'}
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          ref={emailRef}
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />

        {!isForgot && (
          <PasswordField
            ref={passwordRef}
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            trailing={
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-[13px] font-medium text-[var(--color-accent-text)] underline-offset-2 hover:underline"
              >
                Forgot password?
              </button>
            }
          />
        )}

        {errors.form && (
          <p role="alert" className="text-[13px] text-[var(--color-danger)]">
            {errors.form}
          </p>
        )}

        <Button type="submit" size="lg" aria-disabled={loading} className="w-full">
          {loading ? (isForgot ? 'Sending…' : 'Signing in…') : isForgot ? 'Send reset link' : 'Sign in'}
        </Button>
      </form>

      {isForgot && (
        <p className="text-center text-[13px]">
          <button type="button" onClick={() => switchMode('signin')} className="font-medium text-[var(--color-accent-text)] underline-offset-2 hover:underline">
            Back to sign in
          </button>
        </p>
      )}
    </AuthShell>
  )
}
