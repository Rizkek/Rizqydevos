import type { Metadata } from 'next'
import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = { title: 'Reset password' }

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams
  // A repeated ?token=a&token=b is not a valid link.
  return <ResetPasswordForm token={typeof token === 'string' && token ? token : null} />
}
