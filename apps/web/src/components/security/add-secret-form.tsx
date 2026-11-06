'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api'

export interface NewSecret {
  name: string
  key: string
  value: string
  category: string
  username?: string
  url?: string
  tags?: string[]
}

export const SECRET_TYPES = [
  { id: 'password', label: 'Password' },
  { id: 'api-key', label: 'API Key' },
  { id: 'oauth', label: 'OAuth Token' },
  { id: 'database', label: 'Database' },
  { id: 'ssh', label: 'SSH Key' },
] as const

// Tags are typed as one comma-separated field.
export function parseTags(raw: string): string[] {
  return [...new Set(raw.split(',').map((tag) => tag.trim()).filter(Boolean))]
}

const FIELD = 'bg-[var(--color-surface-2)] h-8 text-[13px]'

export function AddSecretForm({ onAdd }: { onAdd: (data: NewSecret) => Promise<void> }) {
  const [name, setName] = React.useState('')
  const [key, setKey] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [value, setValue] = React.useState('')
  const [tags, setTags] = React.useState('')
  const [category, setCategory] = React.useState('password')
  const [open, setOpen] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const secret: NewSecret = { name, key, value, category }
      if (username.trim()) secret.username = username.trim()
      if (url.trim()) secret.url = url.trim()
      const parsedTags = parseTags(tags)
      if (parsedTags.length > 0) secret.tags = parsedTags
      await onAdd(secret)
      setName(''); setKey(''); setUsername(''); setUrl(''); setValue(''); setTags(''); setOpen(false)
    } catch (err) {
      // Inputs stay filled so a fix (for example another username) does not mean typing everything again.
      setError(
        err instanceof ApiError && err.status === 409
          ? `A secret with the key ${key}${username.trim() ? ` and the username ${username.trim()}` : ''} already exists.`
          : 'Could not save the secret. Try again.',
      )
    } finally {
      setPending(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2 self-start shadow-sm">
        <Plus size={15} aria-hidden="true" /> Add Secret
      </Button>
    )
  }

  return (
    <Card className="p-4 border-[var(--color-accent)]/30 bg-[var(--color-surface)] flex flex-col gap-3">
      <h2 className="text-[13px] font-semibold text-[var(--color-text)]">New Secret</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input required placeholder="Name (e.g. GitHub login)" value={name} onChange={e => setName(e.target.value)} className={FIELD} aria-label="Name" maxLength={200} />
          <Input required placeholder="Key (e.g. github.com or GITHUB_TOKEN)" value={key} onChange={e => setKey(e.target.value)} className={`${FIELD} font-mono`} aria-label="Key" maxLength={200} />
          <Input placeholder="Username (optional)" value={username} onChange={e => setUsername(e.target.value)} className={FIELD} aria-label="Username" maxLength={200} autoComplete="off" />
          <Input placeholder="Website (optional)" value={url} onChange={e => setUrl(e.target.value)} className={FIELD} aria-label="Website" maxLength={2048} autoComplete="off" />
        </div>
        <Input required placeholder="Value (will be encrypted)" value={value} onChange={e => setValue(e.target.value)} className={`${FIELD} font-mono`} type="password" aria-label="Value" autoComplete="off" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Type" className="h-8 px-2 rounded-md text-[13px] bg-[var(--color-surface-2)] border border-[var(--color-input-border)] text-[var(--color-text)]">
            {SECRET_TYPES.map((type) => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
          <Input placeholder="Tags (optional, separated by commas)" value={tags} onChange={e => setTags(e.target.value)} className={FIELD} aria-label="Tags" autoComplete="off" />
        </div>
        {error && <p role="alert" className="text-[13px] text-[var(--color-danger)]">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" type="button" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" size="sm" disabled={pending}>{pending ? 'Saving…' : 'Save Encrypted'}</Button>
        </div>
      </form>
    </Card>
  )
}
