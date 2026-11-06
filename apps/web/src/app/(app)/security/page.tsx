'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Shield, Key, ClipboardList, Archive, ListChecks } from 'lucide-react'
import { fetchApi } from '@/lib/api'
import { LoadingState } from '@/components/shared/loading-state'
import { SecretRow, type Secret } from '@/components/security/secret-row'
import { VaultBackup } from '@/components/security/vault-backup'
import { VaultImport } from '@/components/security/vault-import'
import { AddSecretForm, type NewSecret } from '@/components/security/add-secret-form'
import { ChecklistPanel } from '@/components/security/checklist-panel'
import { useReauth } from '@/components/security/reauth'
import { createQueryOptions, queryKeys } from '@/lib/query'
import { useSession } from '@/lib/auth-client'
import { isTwoFactorEnabled } from '@/lib/two-factor'

const TABS = ['secrets', 'checklist', 'backup', 'audit'] as const
type Tab = (typeof TABS)[number]

// The dashboard links to /security?tab=checklist.
function tabFromQuery(value: string | null): Tab {
  return TABS.find((tab) => tab === value) ?? 'secrets'
}

type AuditLog = {
  id: string
  action: string
  resource: string
  resourceId?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'text-[var(--color-success)]',
  UPDATE: 'text-[var(--color-warning)]',
  DELETE: 'text-[var(--color-danger)]',
  REVEAL_SECRET: 'text-[var(--color-accent)]',
  EXPORT_SECRETS: 'text-[var(--color-accent)]',
  IMPORT_SECRETS: 'text-[var(--color-success)]',
  LOGIN: 'text-[var(--color-info)]',
  LOGOUT: 'text-[var(--color-text-2)]',
}

export default function SecurityPage() {
  // useSearchParams needs a Suspense boundary on a statically rendered page.
  return (
    <React.Suspense fallback={<LoadingState text="Loading security…" className="flex-1" />}>
      <SecurityContent />
    </React.Suspense>
  )
}

function SecurityContent() {
  const searchParams = useSearchParams()
  const [tab, setTab] = React.useState<Tab>(() => tabFromQuery(searchParams.get('tab')))
  const queryClient = useQueryClient()
  const reauth = useReauth()
  const { data: session } = useSession()
  // Warn only once the session is known to be loaded without the flag; a missing session shows nothing.
  const twoFactorOff = session !== null && session !== undefined && !isTwoFactorEnabled(session.user)

  const { data: secrets = [], isLoading: secretsLoading } = useQuery<Secret[]>(
    createQueryOptions(queryKeys.secrets, async () => fetchApi('/secrets'))
  )

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery<AuditLog[]>(
    createQueryOptions(queryKeys.auditLogs, async () => fetchApi('/audit-log'))
  )

  const addMutation = useMutation({
    mutationFn: async (data: NewSecret) => fetchApi('/secrets', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.secrets })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => fetchApi(`/secrets/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.secrets })
    },
  })

  const tabs = [['secrets', Key, 'Secrets Vault'], ['checklist', ListChecks, 'Checklist'], ['backup', Archive, 'Backup and import'], ['audit', ClipboardList, 'Audit Log']] as const

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden h-full max-w-[1200px]">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] flex items-center gap-2">
            <Shield size={20} aria-hidden="true" className="text-[var(--color-accent)]" /> Security
          </h1>
          <p className="text-[14px] text-[var(--color-text-2)] mt-1">Encrypted secrets vault, per-project checklist, backups, and the audit trail</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-[var(--color-surface-2)] p-1 rounded-lg w-fit border border-[var(--color-border-subtle)]">
        {tabs.map(([t, Icon, label]) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-all ${tab === t ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
          >
            <Icon size={14} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      {tab === 'secrets' && (
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {twoFactorOff && (
            <p role="status" className="rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning-muted)] p-3 text-[13px] text-[var(--color-text)]">
              Two-factor sign-in is off. Turn it on in <Link href="/settings" className="font-medium underline underline-offset-2">Settings</Link> before you store real passwords here.
            </p>
          )}
          <AddSecretForm onAdd={async (data) => { await addMutation.mutateAsync(data) }} />
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {secretsLoading ? (
              <LoadingState text="Loading vault…" className="h-40 p-0" />
            ) : secrets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-[var(--color-text-muted)]">
                <Key size={24} aria-hidden="true" className="opacity-30" />
                <p className="text-[13px]">No secrets yet. Add your first secret above, import a password export, or restore a backup.</p>
              </div>
            ) : (
              secrets.map((s) => (
                <SecretRow key={s.id} secret={s} runWithReauth={reauth.run} onDelete={(id) => { if (confirm(`Delete ${s.name}?`)) deleteMutation.mutate(id) }} />
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'checklist' && <ChecklistPanel />}

      {tab === 'backup' && (
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-8">
          <VaultBackup runWithReauth={reauth.run} />
          <VaultImport />
        </div>
      )}

      {tab === 'audit' && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {auditLoading ? (
            <LoadingState text="Loading audit log…" className="h-40 p-0" />
          ) : auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-[var(--color-text-muted)]">
              <ClipboardList size={24} aria-hidden="true" className="opacity-30" />
              <p className="text-[13px]">No audit events yet. Actions you take will appear here.</p>
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-2)]/50 border border-[var(--color-border-subtle)]">
                <div className={`text-[12px] font-mono font-bold px-2 py-1 rounded shrink-0 mt-0.5 ${ACTION_COLORS[log.action] ?? 'text-[var(--color-text-2)]'} bg-current/10`}>
                  {log.action}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--color-text)]">
                    <span className="font-mono text-[var(--color-text-2)]">{log.resource}</span>
                    {log.resourceId && <span className="text-[var(--color-text-muted)] text-[12px] ml-2 font-mono">#{log.resourceId.slice(0, 8)}</span>}
                  </p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5 font-mono">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
                <span className="text-[12px] text-[var(--color-text-muted)] whitespace-nowrap shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {reauth.dialog}
    </div>
  )
}
