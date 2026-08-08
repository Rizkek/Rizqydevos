'use client'

import * as React from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUIStore, type Theme, type AccentColor } from '@/stores/ui.store'
import { Check, User, Keyboard, Paintbrush, Monitor } from 'lucide-react'

const themes: { id: Theme; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'system', label: 'System' },
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
            <Paintbrush size={16} className="text-[var(--color-accent)]" /> Appearance
          </h2>
          <Card className="p-5 flex flex-col gap-6">
            
            {/* Theme */}
            <div className="flex flex-col gap-3">
              <label className="text-[13px] font-medium text-[var(--color-text)]">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {themes.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      theme === t.id 
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' 
                        : 'border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-2)] hover:border-[var(--color-border-strong)]'
                    }`}
                  >
                    <Monitor size={20} className="mb-2" />
                    <span className="text-[12px] font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Accent Color */}
            <div className="flex flex-col gap-3">
              <label className="text-[13px] font-medium text-[var(--color-text)]">Accent Color</label>
              <div className="flex flex-wrap gap-3">
                {colors.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setAccentColor(c.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border-2 transition-all ${
                      accentColor === c.id 
                        ? 'border-[var(--color-border-strong)] bg-[var(--color-surface-2)] text-[var(--color-text)]' 
                        : 'border-transparent bg-[var(--color-surface)] text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${c.bgClass} flex items-center justify-center text-white`}>
                      {accentColor === c.id && <Check size={10} />}
                    </div>
                    <span className="text-[13px] font-medium">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </Card>
        </section>

        {/* Profile */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)] flex items-center gap-2">
            <User size={16} className="text-[var(--color-text-muted)]" /> Profile
          </h2>
          <Card className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-lg">
                R
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[var(--color-text)]">Rizqy</h3>
                <p className="text-[13px] text-[var(--color-text-2)]">dev@rizqy.me</p>
              </div>
            </div>
            <Button variant="outline">Edit Profile</Button>
          </Card>
        </section>

        {/* Shortcuts */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)] flex items-center gap-2">
            <Keyboard size={16} className="text-[var(--color-text-muted)]" /> Keyboard Shortcuts
          </h2>
          <Card className="p-0 overflow-hidden divide-y divide-[var(--color-border-subtle)]">
            {[
              { action: 'Open Command Palette', key: '⌘ K' },
              { action: 'Toggle Sidebar', key: '⌘ B' },
              { action: 'Go to Dashboard', key: 'G then D' },
              { action: 'Go to Workspace', key: 'G then W' },
            ].map(shortcut => (
              <div key={shortcut.action} className="flex items-center justify-between p-4">
                <span className="text-[13px] text-[var(--color-text)] font-medium">{shortcut.action}</span>
                <Badge variant="secondary" className="font-mono text-[11px] px-2 py-1 h-auto rounded-[var(--radius-sm)]">
                  {shortcut.key}
                </Badge>
              </div>
            ))}
          </Card>
        </section>

      </div>
    </div>
  )
}