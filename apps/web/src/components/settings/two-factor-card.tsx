'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { PasswordField, TextField } from '@/components/ui/text-field'
import { twoFactor } from '@/lib/auth-client'
import { normalizeCode, totpSecretFromUri } from '@/lib/two-factor'

type PasswordAction = 'enable' | 'disable' | 'codes'

type Flow =
  | { step: 'idle' }
  | { step: 'password'; action: PasswordAction }
  | { step: 'setup'; uri: string; backupCodes: string[] }
  | { step: 'codes'; backupCodes: string[] }

const PASSWORD_PROMPT: Record<PasswordAction, { title: string; submit: string }> = {
  enable: { title: 'Enter your password to start setting up two-factor sign-in.', submit: 'Continue' },
  disable: { title: 'Enter your password to turn off two-factor sign-in.', submit: 'Turn off' },
  codes: { title: 'Enter your password to create new backup codes. The old codes stop working.', submit: 'Create codes' },
}

interface TwoFactorCardProps {
  enabled: boolean
}

function BackupCodes({ codes }: { codes: string[] }) {
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[13px] font-medium text-[var(--color-text)]">Backup codes</h3>
      <p className="text-[13px] text-[var(--color-text-2)]">
        Save these now. Each code works once if you lose your authenticator app, and they are not shown again.
      </p>
      <ul className="grid grid-cols-2 gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 font-mono text-[13px] text-[var(--color-text)]">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" onClick={() => void copy()}>Copy codes</Button>
        {copied && <span role="status" className="text-[13px] text-[var(--color-text-2)]">Copied</span>}
      </div>
    </div>
  )
}

export function TwoFactorCard({ enabled }: TwoFactorCardProps) {
  const [flow, setFlow] = React.useState<Flow>({ step: 'idle' })
  const [password, setPassword] = React.useState('')
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState<string | undefined>()
  const [notice, setNotice] = React.useState<string | undefined>()
  const [pending, setPending] = React.useState(false)

  const goIdle = (message?: string) => {
    setFlow({ step: 'idle' })
    setPassword('')
    setCode('')
    setError(undefined)
    setNotice(message)
  }

  const startPassword = (action: PasswordAction) => {
    setNotice(undefined)
    setError(undefined)
    setFlow({ step: 'password', action })
  }

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pending || flow.step !== 'password') return
    if (!password) {
      setError('Enter your password.')
      return
    }
    setPending(true)
    try {
      if (flow.action === 'enable') {
        const { data, error: failure } = await twoFactor.enable({ password })
        if (failure || !data || !('totpURI' in data)) {
          setError('Could not start the setup. Check your password and try again.')
          return
        }
        setPassword('')
        setError(undefined)
        setFlow({ step: 'setup', uri: data.totpURI, backupCodes: data.backupCodes })
      } else if (flow.action === 'disable') {
        const { error: failure } = await twoFactor.disable({ password })
        if (failure) {
          setError('Could not turn it off. Check your password and try again.')
          return
        }
        goIdle('Two-factor sign-in is off.')
      } else {
        const { data, error: failure } = await twoFactor.generateBackupCodes({ password })
        if (failure || !data) {
          setError('Could not create new codes. Check your password and try again.')
          return
        }
        setPassword('')
        setError(undefined)
        setFlow({ step: 'codes', backupCodes: data.backupCodes })
      }
    } finally {
      setPending(false)
    }
  }

  const confirmSetup = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pending) return
    const clean = normalizeCode('totp', code)
    if (!clean) {
      setError('Enter the 6-digit code from your authenticator app.')
      return
    }
    setPending(true)
    try {
      const { error: failure } = await twoFactor.verifyTotp({ code: clean })
      if (failure) {
        setError('That code is not right. Check the code in your authenticator app and try again.')
        return
      }
      goIdle('Two-factor sign-in is on. Next time you sign in, you will be asked for a code.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-[13px] text-[var(--color-text-2)]">
          Sign-in asks for a 6-digit code from an authenticator app after the password. Turn it on before you store real passwords in the vault.
        </p>
        <p className="text-[13px] font-medium text-[var(--color-text)]">
          Status: {enabled ? 'On' : 'Off'}
        </p>
      </div>

      {notice && <p role="status" className="text-[13px] text-[var(--color-text-2)]">{notice}</p>}

      {flow.step === 'idle' && (
        <div className="flex flex-wrap gap-2">
          {enabled ? (
            <>
              <Button type="button" variant="ghost" onClick={() => startPassword('codes')}>New backup codes</Button>
              <Button type="button" variant="ghost" onClick={() => startPassword('disable')}>Turn off</Button>
            </>
          ) : (
            <Button type="button" onClick={() => startPassword('enable')}>Turn on</Button>
          )}
        </div>
      )}

      {flow.step === 'password' && (
        <form onSubmit={submitPassword} noValidate className="flex flex-col gap-3">
          <p className="text-[13px] text-[var(--color-text-2)]">{PASSWORD_PROMPT[flow.action].title}</p>
          <PasswordField label="Password" value={password} onChange={(event) => setPassword(event.target.value)} error={error} autoComplete="current-password" autoFocus />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>{pending ? 'Checking…' : PASSWORD_PROMPT[flow.action].submit}</Button>
            <Button type="button" variant="ghost" onClick={() => goIdle()}>Cancel</Button>
          </div>
        </form>
      )}

      {flow.step === 'setup' && (
        <form onSubmit={confirmSetup} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-[13px] font-medium text-[var(--color-text)]">1. Add DevOS to your authenticator app</h3>
            <p className="text-[13px] text-[var(--color-text-2)]">
              Open the link on a device with an authenticator app, or type this key into the app by hand (time-based, 6 digits).
            </p>
            <p className="break-all rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 font-mono text-[13px] text-[var(--color-text)]">
              {totpSecretFromUri(flow.uri) ?? 'Key unavailable. Use the link below.'}
            </p>
            <a href={flow.uri} className="self-start text-[13px] font-medium text-[var(--color-accent-text)] underline-offset-2 hover:underline">
              Open in authenticator app
            </a>
          </div>

          <BackupCodes codes={flow.backupCodes} />

          <div className="flex flex-col gap-2">
            <h3 className="text-[13px] font-medium text-[var(--color-text)]">2. Confirm with a code</h3>
            <TextField
              label="Authenticator code"
              autoComplete="one-time-code"
              inputMode="numeric"
              spellCheck={false}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              error={error}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>{pending ? 'Checking…' : 'Turn on'}</Button>
            <Button type="button" variant="ghost" onClick={() => goIdle('Setup cancelled. Two-factor sign-in is still off.')}>Cancel</Button>
          </div>
        </form>
      )}

      {flow.step === 'codes' && (
        <div className="flex flex-col gap-3">
          <BackupCodes codes={flow.backupCodes} />
          <div>
            <Button type="button" onClick={() => goIdle('New backup codes created. The old ones no longer work.')}>Done</Button>
          </div>
        </div>
      )}
    </div>
  )
}
