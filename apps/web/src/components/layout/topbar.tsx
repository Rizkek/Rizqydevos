'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Search, User, LogOut } from 'lucide-react'
import { useSession, signOut } from '@/lib/auth-client'
import { useCommandStore } from '@/stores/command.store'
import { useMobileNavStore } from '@/stores/mobile-nav.store'

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
    <header className="h-[48px] bg-[var(--color-bg)] border-b border-[var(--color-border)] flex items-center justify-between gap-2 px-3 md:px-6 shrink-0 sticky top-0 z-10">
      <div className="flex items-center min-w-0 gap-2 text-[13px] font-medium text-[var(--color-text-2)]">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => useMobileNavStore.getState().setIsOpen(true)}
          className="md:hidden inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
        >
          <Menu aria-hidden="true" size={16} />
        </button>
        <span className="hidden sm:inline">DevOS</span>
        <span aria-hidden="true" className="hidden sm:inline text-[var(--color-text-muted)]">/</span>
        <span className="truncate text-[var(--color-text)]">{title}</span>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <button
          type="button"
          aria-label="Open command palette"
          onClick={() => useCommandStore.getState().setIsOpen(true)}
          className="flex items-center h-8 rounded-md border border-[var(--color-input-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-strong)] transition-colors text-[13px] text-[var(--color-text-2)] group w-8 md:w-56 md:justify-between justify-center md:px-3 px-0"
        >
          <div className="flex items-center gap-2">
            <Search aria-hidden="true" size={14} className="text-[var(--color-text-2)]" />
            <span className="hidden md:inline">Search...</span>
          </div>
          <kbd className="hidden md:flex font-mono text-[12px] font-medium text-[var(--color-text-2)] bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-[4px] px-1.5 h-[20px] items-center tracking-normal">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-2 md:ml-1">
          {session && (
            <span className="text-[12px] font-medium text-[var(--color-text-2)] hidden md:block">
              {session.user.name || session.user.email}
            </span>
          )}

          <div className="flex items-center gap-2">
            <div
              role="img"
              aria-label={session ? `Signed in as ${session.user.name || session.user.email}` : 'Not signed in'}
              className="w-8 h-8 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center border border-[var(--color-border)] relative overflow-hidden"
            >
              {session?.user?.image ? (
                <img src={session.user.image} alt="" width={32} height={32} className="w-full h-full object-cover" />
              ) : (
                <User size={14} aria-hidden="true" className="text-[var(--color-text-2)]" />
              )}
            </div>

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
