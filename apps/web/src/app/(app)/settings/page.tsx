'use client'

import * as React from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { IntegrationCard } from '@/components/settings/integration-card'
import { useUIStore, type Theme, type AccentColor } from '@/stores/ui.store'
import { Check, User, Keyboard, Paintbrush, Monitor, Moon, Sun, Link2, type LucideIcon } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { useIntegrations } from '@/lib/integrations'

const themes: { id: Theme; label: string; icon: LucideIcon }[] = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
]

const colors: { id: AccentColor; label: string; bgClass: string }[] = [
  { id: 'violet', label: 'Violet', bgClass: 'bg-violet-500' },
  { id: 'emerald', label: 'Emerald', bgClass: 'bg-emerald-500' },
  { id: 'cyan', label: 'Cyan', bgClass: 'bg-cyan-500' },
  { id: 'amber', label: 'Amber', bgClass: 'bg-amber-500' },
  { id: 'rose', label: 'Rose', bgClass: 'bg-rose-500' },
]

export default function SettingsPage() {
  const { theme, setTheme, accentColor, setAccentColor } = useUIStore()
  const { data: session, isPending: isLoadingSession } = useSession()
  const { data: integrations = [], isLoading: isLoadingIntegrations, error: integrationsError } = useIntegrations()

  const displayName = session?.user.name || session?.user.email || ''

  return (
    <div className="p-[var(--spacing-page-pad)] max-w-4xl mx-auto w-full h-full flex flex-col">
      <PageHeader
        title="Settings"
        description="Manage your appearance, widgets, and account preferences."
      />

      <div className="flex flex-col gap-8 overflow-y-auto pb-12">

        {/* Appearance */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)] flex items-center gap-2">
            <Paintbrush aria-hidden="true" size={16} className="text-[var(--color-accent)]" /> Appearance
          </h2>
          <Card className="p-5 flex flex-col gap-6">

            {/* Theme */}
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-[13px] font-medium text-[var(--color-text)]">Theme</legend>
              <div className="grid grid-cols-3 gap-3">
                {themes.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={theme === t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      theme === t.id
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                        : 'border-[var(--color-input-border)] bg-[var(--color-surface)] text-[var(--color-text-2)] hover:border-[var(--color-border-strong)]'
                    }`}
                  >
                    <t.icon aria-hidden="true" size={20} className="mb-2" />
                    <span className="text-[12px] font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Accent Color */}
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-[13px] font-medium text-[var(--color-text)]">Accent color</legend>
              <div className="flex flex-wrap gap-3">
                {colors.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={accentColor === c.id}
                    onClick={() => setAccentColor(c.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border-2 transition-all ${
                      accentColor === c.id
                        ? 'border-[var(--color-border-strong)] bg-[var(--color-surface-2)] text-[var(--color-text)]'
                        : 'border-transparent bg-[var(--color-surface)] text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <div aria-hidden="true" className={`w-4 h-4 rounded-full ${c.bgClass} flex items-center justify-center text-white`}>
                      {accentColor === c.id && <Check size={10} />}
                    </div>
                    <span className="text-[13px] font-medium">{c.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

          </Card>
        </section>

        {/* Profile */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)] flex items-center gap-2">
            <User aria-hidden="true" size={16} className="text-[var(--color-text-muted)]" /> Profile
          </h2>
          <Card className="p-5 flex items-center gap-4">
            {isLoadingSession ? (
              <div role="status" className="flex items-center gap-4">
                <span className="sr-only">Loading profile</span>
                <Skeleton aria-hidden="true" className="w-12 h-12 rounded-full" />
                <Skeleton aria-hidden="true" className="h-10 w-48" />
              </div>
            ) : session ? (
              <>
                <div aria-hidden="true" className="w-12 h-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-[var(--color-on-solid)] font-bold text-lg">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[var(--color-text)]">{session.user.name || session.user.email}</p>
                  {session.user.name && <p className="text-[13px] text-[var(--color-text-2)]">{session.user.email}</p>}
                </div>
              </>
            ) : (
              <p className="text-[13px] text-[var(--color-text-2)]">Profile unavailable. Sign in again.</p>
            )}
          </Card>
        </section>

        {/* Integrations */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)] flex items-center gap-2">
            <Link2 aria-hidden="true" size={16} className="text-[var(--color-text-muted)]" /> Integrations
          </h2>
          <Card className="p-5 flex flex-col gap-6">
            {isLoadingIntegrations ? (
              <div role="status" className="flex flex-col gap-3">
                <span className="sr-only">Loading integrations</span>
                <Skeleton aria-hidden="true" className="h-24 w-full" />
                <Skeleton aria-hidden="true" className="h-24 w-full" />
              </div>
            ) : integrationsError ? (
              <p role="alert" className="text-[13px] text-[var(--color-danger)]">
                Could not load integrations. Reload the page to try again.
              </p>
            ) : (
              <>
                <IntegrationCard
                  provider="github"
                  description="Activity feed and repositories on the dashboard and Developer page."
                  tokenHint="Create a personal access token in your GitHub settings. It is stored encrypted."
                  integration={integrations.find(i => i.provider === 'github')}
                />

                <div className="h-px bg-[var(--color-border-subtle)] w-full" />

                <IntegrationCard
                  provider="vercel"
                  description="Recent deployments on the dashboard and Infrastructure page."
                  tokenHint="Create an access token in your Vercel account settings. It is stored encrypted."
                  integration={integrations.find(i => i.provider === 'vercel')}
                  withTeamId
                />
              </>
            )}
          </Card>
        </section>

        {/* Shortcuts */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)] flex items-center gap-2">
            <Keyboard aria-hidden="true" size={16} className="text-[var(--color-text-muted)]" /> Keyboard Shortcuts
          </h2>
          <Card className="p-0 overflow-hidden divide-y divide-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between p-4">
              <span className="text-[13px] text-[var(--color-text)] font-medium">Open command palette</span>
              <kbd className="font-mono text-[12px] px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-3)] text-[var(--color-text-2)]">
                Ctrl K or ⌘ K
              </kbd>
            </div>
          </Card>
        </section>

      </div>
    </div>
  )
}
