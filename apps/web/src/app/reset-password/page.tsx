'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PasswordField } from '@/components/ui/text-field'
import { AuthShell } from '@/components/auth/auth-shell'
import { resetPassword } from '@/lib/auth-client'

const PASSWORD_HINT = 'Use at least 8 characters, with one letter and one number.'

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<AuthShell title="Reset password" />}>
      <ResetPasswordForm />
    </React.Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const token = useSearchParams().get('token')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [revealed, setRevealed] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<{ password?: string; confirmPassword?: string; form?: string }>({})
  const passwordRef = React.useRef<HTMLInputElement>(null)
  const confirmPasswordRef = React.useRef<HTMLInputElement>(null)

  if (!token) {
    return (
      <AuthShell title="Reset link not valid" description="This password reset link is incomplete or has expired.">
        <Button asChild>
          <Link href="/login">Request a new link</Link>
        </Button>
      </AuthShell>
    )
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return

    const isStrong = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
    if (!isStrong) {
      setErrors({ password: PASSWORD_HINT })
      passwordRef.current?.focus()
      return
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'The passwords do not match.' })
      confirmPasswordRef.current?.focus()
      return
    }

    setErrors({})
    setLoading(true)
    try {
      const { error } = await resetPassword({ newPassword: password, token })
      if (error) {
        setErrors({ form: error.message || 'Could not reset the password. Request a new link and try again.' })
        return
      }
      toast.success('Password updated. You can now sign in.')
      router.push('/login')
    } catch {
      setErrors({ form: 'Could not reset the password. Request a new link and try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Reset password" description="Choose a new password for your DevOS account.">
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordField
          ref={passwordRef}
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          hint={PASSWORD_HINT}
          revealed={revealed}
          onRevealedChange={setRevealed}
        />
        <PasswordField
          ref={confirmPasswordRef}
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
          revealed={revealed}
          onRevealedChange={setRevealed}
        />
        {errors.form && (
          <p role="alert" className="text-[13px] text-[var(--color-danger)]">
            {errors.form}
          </p>
        )}
        <Button type="submit" size="lg" aria-disabled={loading} className="w-full">
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  )
}
