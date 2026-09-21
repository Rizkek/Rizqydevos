'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Search, User, LogOut } from 'lucide-react'
import { useSession, signOut } from '@/lib/auth-client'
import { useCommandStore } from '@/stores/command.store'

export function Topbar() {
  const pathname = usePathname()

  const { data: session } = useSession()

  // Simple breadcrumb logic based on pathname
  const pathSegments = (pathname || '').split('/').filter(Boolean)
  const firstSegment = pathSegments[0]
  const title = firstSegment
    ? firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1)
    : 'Dashboard'

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="h-[48px] bg-[var(--color-bg)] border-b border-[var(--color-border)] flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
      <div className="flex items-center text-[13px] font-medium text-[var(--color-text-2)]">
        DevOS
        <span className="mx-2 text-[var(--color-border-strong)]">/</span>
        <span className="text-[var(--color-text)]">{title}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open command palette"
          onClick={() => useCommandStore.getState().setIsOpen(true)}
          className="flex items-center h-8 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-strong)] transition-colors text-[13px] text-[var(--color-text-muted)] group w-56 justify-between"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-[var(--color-text-2)]" />
            <span>Search...</span>
          </div>
          <kbd className="font-mono text-[11px] font-medium text-[var(--color-text-2)] bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-[4px] px-1.5 h-[20px] flex items-center tracking-normal">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors relative"
        >
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2 ml-1">
          {session && (
            <span className="text-[12px] font-medium text-[var(--color-text-2)] hidden md:block">
              {session.user.name || session.user.email}
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Open user menu"
              className="w-8 h-8 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors relative overflow-hidden"
            >
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={14} className="text-[var(--color-text-2)]" />
              )}
            </button>

            <button
              type="button"
              aria-label="Sign out"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-2)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)] transition-colors"
              title="Sign out"
            >
              <LogOut size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
