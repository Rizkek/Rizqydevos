'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavLinks, mainNavItems, settingsNavItem } from './nav-links'

const NAV_ID = 'main-navigation'

// Desktop sidebar. Below the md breakpoint navigation lives in MobileNav instead.
export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  return (
    <aside
      className={cn(
        'hidden md:flex h-dvh shrink-0 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)]',
        'transition-[width] duration-200 motion-reduce:transition-none',
        isCollapsed ? 'w-14' : 'w-60',
      )}
    >
      <div className="h-[48px] flex items-center px-4 shrink-0">
        <div aria-hidden="true" className="w-6 h-6 rounded-md bg-[var(--color-accent)] flex items-center justify-center shrink-0">
          <span className="text-[12px] font-bold text-[var(--color-on-solid)]">D</span>
        </div>
        <span className={cn('ml-3 font-semibold text-[var(--color-text)] whitespace-nowrap', isCollapsed && 'sr-only')}>DevOS</span>
      </div>

      <nav id={NAV_ID} aria-label="Main" className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3">
        <NavLinks items={mainNavItems} collapsed={isCollapsed} />
      </nav>

      <div className="p-3 shrink-0 flex flex-col gap-1 border-t border-[var(--color-border-subtle)]">
        <nav aria-label="Account">
          <NavLinks items={[settingsNavItem]} collapsed={isCollapsed} />
        </nav>
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          aria-expanded={!isCollapsed}
          aria-controls={NAV_ID}
          className="flex items-center h-8 px-3 rounded-md text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors"
        >
          {isCollapsed ? <ChevronRight aria-hidden="true" size={16} className="shrink-0" /> : <ChevronLeft aria-hidden="true" size={16} className="shrink-0" />}
          <span className={cn('whitespace-nowrap font-medium text-[13px]', isCollapsed ? 'sr-only' : 'ml-2')}>
            {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </span>
        </button>
      </div>
    </aside>
  )
}
