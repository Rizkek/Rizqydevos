'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Shield,
  Key,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  ClipboardList,
  Loader2,
  AlertCircle,
  Server,
} from 'lucide-react'

type Tab = 'secrets' | 'audit'

const API = 'http://localhost:3001/api/v1'

const CATEGORY_COLORS: Record<string, string> = {
  'api-key': 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  'oauth': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'database': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'ssh': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'text-emerald-400',
  UPDATE: 'text-yellow-400',
  DELETE: 'text-red-400',
  REVEAL_SECRET: 'text-violet-400',
  LOGIN: 'text-blue-400',
  LOGOUT: 'text-gray-400',
}

function AddSecretDialog({ onAdd }: { onAdd: (data: any) => void }) {
  const [name, setName] = React.useState('')
  const [key, setKey] = React.useState('')
  const [value, setValue] = React.useState('')
  const [category, setCategory] = React.useState('api-key')
  const [open, setOpen] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({ name, key, value, category })
    setName(''); setKey(''); setValue(''); setOpen(false)
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2 shadow-sm">
        <Plus size={15} /> Add Secret
      </Button>
    )
  }

  return (
    <Card className="p-4 border-[var(--color-accent)]/30 bg-[var(--color-surface)] flex flex-col gap-3">
      <h4 className="text-[13px] font-semibold text-[var(--color-text)]">New Secret</h4>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input required placeholder="Name (e.g. GitHub PAT)" value={name} onChange={e => setName(e.target.value)} className="bg-[var(--color-surface-2)] h-8 text-[13px]" />
          <Input required placeholder="Key (e.g. GITHUB_TOKEN)" value={key} onChange={e => setKey(e.target.value)} className="bg-[var(--color-surface-2)] h-8 text-[13px] font-mono" />
        </div>
        <Input required placeholder="Value (will be encrypted)" value={value} onChange={e => setValue(e.target.value)} className="bg-[var(--color-surface-2)] h-8 text-[13px] font-mono" type="password" />
        <select value={category} onChange={e => setCategory(e.target.value)} className="h-8 px-2 rounded-md text-[13px] bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] text-[var(--color-text)]">
          <option value="api-key">API Key</option>
          <option value="oauth">OAuth Token</option>
          <option value="database">Database</option>
          <option value="ssh">SSH Key</option>
        </select>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" type="button" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" size="sm">Save Encrypted</Button>
        </div>
      </form>
    </Card>
  )
}

function SecretRow({ secret, onDelete }: { secret: any; onDelete: (id: string) => void }) {
  const [revealed, setRevealed] = React.useState(false)
  const [revealedValue, setRevealedValue] = React.useState<string | null>(null)
  const [revealing, setRevealing] = React.useState(false)

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(false)
      setRevealedValue(null)
      return
    }
    setRevealing(true)
    try {
      const res = await fetch(`${API}/secrets/${secret.id}/reveal`)
      const data = await res.json()
      setRevealedValue(data.value)
      setRevealed(true)
    } finally {
      setRevealing(false)
    }
  }

  const handleCopy = async () => {
    if (!revealedValue) return
    await navigator.clipboard.writeText(revealedValue)
  }

  const categoryClass = CATEGORY_COLORS[secret.category] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-2)]/50 border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] transition-colors group">
      <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-3)] flex items-center justify-center shrink-0">
        <Key size={14} className="text-[var(--color-text-2)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-[var(--color-text)]">{secret.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${categoryClass}`}>{secret.category}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <code className="text-[11px] text-[var(--color-text-muted)] font-mono">{secret.key}</code>
          <span className="text-[var(--color-border-strong)]">·</span>
          <code className="text-[11px] text-[var(--color-text-muted)] font-mono tracking-widest">
            {revealed && revealedValue ? revealedValue : '••••••••••••'}
          </code>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {revealed && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}><Copy size={13} /></Button>}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReveal} disabled={revealing}>
          {revealing ? <Loader2 size={13} className="animate-spin" /> : revealed ? <EyeOff size={13} /> : <Eye size={13} />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10" onClick={() => onDelete(secret.id)}>
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  )
}

export default function SecurityPage() {
  const [tab, setTab] = React.useState<Tab>('secrets')
  const queryClient = useQueryClient()

  const { data: secrets = [], isLoading: secretsLoading } = useQuery({
    queryKey: ['secrets'],
    queryFn: async () => {
      const res = await fetch(`${API}/secrets`)
      if (!res.ok) throw new Error('Failed to load secrets')
      return res.json()
    }
  })

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ['audit-log'],
    queryFn: async () => {
      const res = await fetch(`${API}/monitoring/audit`)
      if (!res.ok) throw new Error('Failed to load audit log')
      return res.json()
    },
    enabled: tab === 'audit',
  })

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API}/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create secret')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['secrets'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`${API}/secrets/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['secrets'] }),
  })

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden h-full max-w-[1200px]">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] flex items-center gap-2">
            <Shield size={20} className="text-[var(--color-accent)]" /> Security
          </h1>
          <p className="text-[14px] text-[var(--color-text-2)] mt-1">Encrypted secrets vault and full audit trail</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 bg-[var(--color-surface-2)] p-1 rounded-lg w-fit border border-[var(--color-border-subtle)]">
        {([['secrets', Key, 'Secrets Vault'], ['audit', ClipboardList, 'Audit Log']] as const).map(([t, Icon, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-all ${tab === t ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Secrets Tab */}
      {tab === 'secrets' && (
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          <AddSecretDialog onAdd={(data) => addMutation.mutate(data)} />
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {secretsLoading ? (
              <div className="flex items-center justify-center h-40 gap-2 text-[var(--color-text-2)] text-[13px]">
                <Loader2 size={16} className="animate-spin" /> Loading vault...
              </div>
            ) : secrets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-[var(--color-text-muted)]">
                <Key size={24} className="opacity-30" />
                <p className="text-[13px]">No secrets yet. Add your first API key above.</p>
              </div>
            ) : (
              secrets.map((s: any) => (
                <SecretRow key={s.id} secret={s} onDelete={(id) => deleteMutation.mutate(id)} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {tab === 'audit' && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {auditLoading ? (
            <div className="flex items-center justify-center h-40 gap-2 text-[var(--color-text-2)] text-[13px]">
              <Loader2 size={16} className="animate-spin" /> Loading audit log...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-[var(--color-text-muted)]">
              <ClipboardList size={24} className="opacity-30" />
              <p className="text-[13px]">No audit events yet. Actions you take will appear here.</p>
            </div>
          ) : (
            auditLogs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-2)]/50 border border-[var(--color-border-subtle)]">
                <div className={`text-[11px] font-mono font-bold px-2 py-1 rounded shrink-0 mt-0.5 ${ACTION_COLORS[log.action] ?? 'text-gray-400'} bg-current/10`}>
                  {log.action}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--color-text)]">
                    <span className="font-mono text-[var(--color-text-2)]">{log.resource}</span>
                    {log.resourceId && <span className="text-[var(--color-text-muted)] text-[11px] ml-2 font-mono">#{log.resourceId.slice(0, 8)}</span>}
                  </p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 font-mono">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-[var(--color-text-muted)] whitespace-nowrap shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}