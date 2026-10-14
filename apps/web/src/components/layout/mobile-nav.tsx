'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useMobileNavStore } from '@/stores/mobile-nav.store'
import { useReturnFocus } from '@/lib/use-return-focus'
import { NavLinks, mainNavItems, settingsNavItem } from './nav-links'

// Drawer for viewports below md. Radix supplies the dialog role, focus trap, Escape and focus return.
export function MobileNav() {
  const isOpen = useMobileNavStore((state) => state.isOpen)
  const setIsOpen = useMobileNavStore((state) => state.setIsOpen)
  const close = () => setIsOpen(false)
  const returnFocus = useReturnFocus()

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="md:hidden fixed inset-0 z-[var(--z-overlay)] bg-[var(--color-overlay)]" />
        <Dialog.Content
          aria-describedby={undefined}
          {...returnFocus}
          className="md:hidden fixed inset-y-0 left-0 z-[var(--z-modal)] flex w-72 max-w-[85vw] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <div className="h-[48px] flex items-center justify-between px-4 shrink-0">
            <Dialog.Title className="font-semibold text-[var(--color-text)]">DevOS</Dialog.Title>
            <Dialog.Close
              aria-label="Close navigation"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
            >
              <X aria-hidden="true" size={16} />
            </Dialog.Close>
          </div>
          <nav aria-label="Main" className="flex-1 overflow-y-auto p-3">
            <NavLinks items={mainNavItems} onNavigate={close} />
          </nav>
          <nav aria-label="Account" className="p-3 border-t border-[var(--color-border-subtle)]">
            <NavLinks items={[settingsNavItem]} onNavigate={close} />
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
