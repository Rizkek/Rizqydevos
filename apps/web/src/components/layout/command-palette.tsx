'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { useCommandStore } from '@/stores/command.store'
import { useUIStore } from '@/stores/ui.store'
import { 
  LayoutDashboard, FolderKanban, Briefcase, BrainCircuit, TerminalSquare, 
  ServerCrash, ShieldCheck, Activity, Bot, BarChart3, Zap, Settings,
  Moon, Sun, Laptop, Palette, PlusCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function CommandPalette() {
  const router = useRouter()
  const { isOpen, setIsOpen } = useCommandStore()
  const { setTheme, theme, accentColor, setAccentColor } = useUIStore()

  // Toggle the menu when ⌘K is pressed
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [isOpen, setIsOpen])

  const runCommand = React.useCallback((command: () => unknown) => {
    setIsOpen(false)
    command()
  }, [setIsOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[var(--z-command)] bg-black/60 flex items-start justify-center pt-[15vh]">
      <Command 
        className="w-full max-w-2xl bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] border border-[var(--color-border-strong)] overflow-hidden flex flex-col"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false)
        }}
      >
        <div className="flex items-center border-b border-[var(--color-border)] px-4">
          <Command.Input 
            autoFocus
            placeholder="What do you need?" 
            className="flex-1 h-14 bg-transparent outline-none text-[15px] placeholder:text-[var(--color-text-muted)] text-[var(--color-text)]" 
          />
          <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded bg-[var(--color-surface-3)] px-2 font-mono text-[10px] font-medium text-[var(--color-text-2)] border border-[var(--color-border)]">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2 overscroll-contain">
          <Command.Empty className="py-12 text-center text-[13px] text-[var(--color-text-muted)]">
            No results found.
          </Command.Empty>

          <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[var(--color-text-muted)] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider">
            <Command.Item onSelect={() => runCommand(() => router.push('/'))} className={itemClass}>
              <LayoutDashboard size={16} /> Dashboard
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/projects'))} className={itemClass}>
              <FolderKanban size={16} /> Projects
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/workspace'))} className={itemClass}>
              <Briefcase size={16} /> Workspace
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/knowledge'))} className={itemClass}>
              <BrainCircuit size={16} /> Knowledge
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/developer'))} className={itemClass}>
              <TerminalSquare size={16} /> Developer
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/infrastructure'))} className={itemClass}>
              <ServerCrash size={16} /> Infrastructure
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/settings'))} className={itemClass}>
              <Settings size={16} /> Settings
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Quick Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[var(--color-text-muted)] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider">
            <Command.Item onSelect={() => runCommand(() => console.log('New Task'))} className={itemClass}>
              <PlusCircle size={16} /> Create Task...
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => console.log('New Snippet'))} className={itemClass}>
              <PlusCircle size={16} /> Create Snippet...
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => console.log('New Project'))} className={itemClass}>
              <PlusCircle size={16} /> Create Project...
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Appearance" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[var(--color-text-muted)] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider">
            <Command.Item onSelect={() => runCommand(() => setTheme('dark'))} className={itemClass}>
              <Moon size={16} /> Dark Theme {theme === 'dark' && ' (Active)'}
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => setTheme('light'))} className={itemClass}>
              <Sun size={16} /> Light Theme {theme === 'light' && ' (Active)'}
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => setTheme('system'))} className={itemClass}>
              <Laptop size={16} /> System Theme {theme === 'system' && ' (Active)'}
            </Command.Item>
            
            <Command.Item onSelect={() => runCommand(() => setAccentColor('violet'))} className={itemClass}>
              <Palette size={16} className="text-violet-500" /> Violet Accent {accentColor === 'violet' && ' (Active)'}
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => setAccentColor('emerald'))} className={itemClass}>
              <Palette size={16} className="text-emerald-500" /> Emerald Accent {accentColor === 'emerald' && ' (Active)'}
            </Command.Item>
          </Command.Group>

        </Command.List>
      </Command>
    </div>
  )
}

const itemClass = "relative flex cursor-default select-none items-center rounded-md px-3 py-2.5 text-[13px] outline-none hover:bg-[var(--color-surface-2)] aria-selected:bg-[var(--color-surface-2)] aria-selected:text-[var(--color-text)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 gap-3 text-[var(--color-text-2)] transition-colors"
