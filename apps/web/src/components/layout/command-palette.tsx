'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import { useReturnFocus } from '@/lib/use-return-focus'
import { useCommandStore } from '@/stores/command.store'
import { useUIStore, type AccentColor, type Theme } from '@/stores/ui.store'
import { Moon, Sun, Laptop, Palette, type LucideIcon } from 'lucide-react'
import { mainNavItems, settingsNavItem } from './nav-links'

const themeCommands: { id: Theme; label: string; icon: LucideIcon }[] = [
  { id: 'dark', label: 'Dark theme', icon: Moon },
  { id: 'light', label: 'Light theme', icon: Sun },
  { id: 'system', label: 'System theme', icon: Laptop },
]

const accentCommands: { id: AccentColor; label: string }[] = [
  { id: 'violet', label: 'Violet accent' },
  { id: 'emerald', label: 'Emerald accent' },
  { id: 'cyan', label: 'Cyan accent' },
  { id: 'amber', label: 'Amber accent' },
  { id: 'rose', label: 'Rose accent' },
]

// Navigation targets mirror the sidebar so the two cannot drift apart.
const navigationCommands = [...mainNavItems, settingsNavItem]

export function CommandPalette() {
  const router = useRouter()
  const { isOpen, setIsOpen } = useCommandStore()
  const { setTheme, theme, accentColor, setAccentColor } = useUIStore()
  const returnFocus = useReturnFocus()

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

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setIsOpen(false)
      command()
    },
    [setIsOpen],
  )

  // Radix Dialog supplies role="dialog", the focus trap and Escape; useReturnFocus restores focus to the opener.
  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-command)] bg-[var(--color-overlay)]" />
        <Dialog.Content aria-label="Command palette" aria-describedby={undefined} className="fixed left-1/2 top-[15vh] z-[var(--z-command)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)]" {...returnFocus}>
        <Command label="Command palette" shouldFilter>
          <div className="flex items-center border-b border-[var(--color-border)] px-4">
            <Command.Input
              placeholder="Search pages and settings"
              aria-label="Search commands"
              className="flex-1 h-14 bg-transparent outline-none text-[15px] placeholder:text-[var(--color-text-muted)] text-[var(--color-text)]"
            />
            <kbd className="hidden sm:inline-flex h-6 items-center rounded bg-[var(--color-surface-3)] px-2 font-mono text-[12px] font-medium text-[var(--color-text-2)] border border-[var(--color-border)]">
              Esc
            </kbd>
          </div>
    
          <Command.List className="max-h-[60vh] overflow-y-auto p-2 overscroll-contain">
            <Command.Empty className="py-12 text-center text-[13px] text-[var(--color-text-2)]">No results found.</Command.Empty>
    
            <Command.Group heading="Navigation" className={groupClass}>
              {navigationCommands.map(({ name, path, icon: Icon }) => (
                <Command.Item key={path} onSelect={() => runCommand(() => router.push(path))} className={itemClass}>
                  <Icon aria-hidden="true" size={16} /> {name}
                </Command.Item>
              ))}
            </Command.Group>
    
            <Command.Group heading="Appearance" className={groupClass}>
              {themeCommands.map(({ id, label, icon: Icon }) => (
                <Command.Item key={id} onSelect={() => runCommand(() => setTheme(id))} className={itemClass}>
                  <Icon aria-hidden="true" size={16} /> {label}
                  {theme === id && <span className="ml-auto text-[12px] text-[var(--color-text-2)]">Current</span>}
                </Command.Item>
              ))}
              {accentCommands.map(({ id, label }) => (
                <Command.Item key={id} onSelect={() => runCommand(() => setAccentColor(id))} className={itemClass}>
                  <Palette aria-hidden="true" size={16} /> {label}
                  {accentColor === id && <span className="ml-auto text-[12px] text-[var(--color-text-2)]">Current</span>}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const groupClass =
  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[var(--color-text-2)] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider'

const itemClass =
  'relative flex cursor-default select-none items-center rounded-md px-3 py-2.5 text-[13px] outline-none hover:bg-[var(--color-surface-2)] aria-selected:bg-[var(--color-surface-2)] aria-selected:text-[var(--color-text)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 gap-3 text-[var(--color-text-2)] transition-colors'
