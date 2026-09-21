'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetPassword } from '@/lib/auth-client'

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<ResetPasswordShell />}> 
      <ResetPasswordForm />
    </React.Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const isValidPassword = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) {
      toast.error('This password reset link is invalid or incomplete.')
      return
    }
    if (!isValidPassword) {
      toast.error('Password must be at least 8 characters and include a letter and a number.')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error } = await resetPassword({ newPassword: password, token })
      if (error) {
        toast.error(error.message || 'Unable to reset password.')
        return
      }
      toast.success('Password updated. You can now sign in.')
      router.push('/login')
    } catch {
      toast.error('Unable to reset password. Please request a new link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <Card className="w-full max-w-md p-8 space-y-6 bg-[var(--color-surface)] border-white/10">
        <div className="text-center space-y-2">
          <LockKeyhole className="mx-auto text-[var(--color-accent)]" size={32} />
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Reset password</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Create a new password for your DevOS account.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="New password"
              className="h-11 pr-11"
              aria-label="New password"
            />
            <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-3 text-[var(--color-text-muted)]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Input required type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Confirm new password" aria-label="Confirm new password" />
          <p className="text-xs text-[var(--color-text-muted)]">Use at least 8 characters with one letter and one number.</p>
          <Button type="submit" disabled={loading || !token} className="w-full">
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Update password'}
          </Button>
        </form>
      </Card>
    </main>
  )
}

function ResetPasswordShell() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <Card className="w-full max-w-md p-8 bg-[var(--color-surface)] border-white/10">
        <Loader2 className="mx-auto animate-spin text-[var(--color-accent)]" size={24} />
      </Card>
    </main>
  )
}