import { twoFactor } from '@/lib/auth-client'

export type SecondFactorKind = 'totp' | 'backup'

// What a successful password sign-in returns when the account has two-factor sign-in on:
// no session yet, only a request for the second step.
export function needsSecondFactor(data: unknown): boolean {
  return typeof data === 'object' && data !== null && 'twoFactorRedirect' in data && data.twoFactorRedirect === true
}

export function isTwoFactorEnabled(user: unknown): boolean {
  return typeof user === 'object' && user !== null && 'twoFactorEnabled' in user && user.twoFactorEnabled === true
}

// The setup link carries the shared secret as ?secret=. Shown as text for apps that cannot open the link.
export function totpSecretFromUri(uri: string): string | null {
  try {
    return new URL(uri).searchParams.get('secret')
  } catch {
    return null
  }
}

// Codes are typed with spaces ("123 456") or pasted with them. Backup codes keep their dash.
export function normalizeCode(kind: SecondFactorKind, raw: string): string {
  return kind === 'totp' ? raw.replace(/\s+/g, '') : raw.trim()
}

const WRONG_CODE: Record<SecondFactorKind, string> = {
  totp: 'That code is not right. Check the code in your authenticator app and try again.',
  backup: 'That backup code is not right, or it was already used.',
}

// Completes a sign-in that is waiting for its second step. Returns an error message, or null on success.
export async function verifySecondFactor(kind: SecondFactorKind, rawCode: string): Promise<string | null> {
  const code = normalizeCode(kind, rawCode)
  if (!code) return kind === 'totp' ? 'Enter the code from your authenticator app.' : 'Enter one of your backup codes.'

  const { error } = kind === 'totp' ? await twoFactor.verifyTotp({ code }) : await twoFactor.verifyBackupCode({ code })
  if (!error) return null
  // Too many wrong tries locks the account for a while; that message tells the user what to do.
  if (error.status === 429 || /locked|too many/i.test(error.message ?? '')) return error.message || 'Too many attempts. Wait a few minutes and try again.'
  return WRONG_CODE[kind]
}
