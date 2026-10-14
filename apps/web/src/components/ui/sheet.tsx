'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { useReturnFocus } from '@/lib/use-return-focus'

// Side panel for create and edit forms. Radix supplies role="dialog", the focus trap, Escape,
// and returning focus to the control that opened it. Full width on phones, capped on larger screens.
export const Sheet = Dialog.Root
export const SheetTitle = Dialog.Title
export const SheetClose = Dialog.Close

export const SheetContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Dialog.Content>>(
  ({ className, children, ...props }, ref) => {
    const returnFocus = useReturnFocus()
    return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--color-overlay)]" />
      <Dialog.Content
        ref={ref}
        aria-describedby={undefined}
        {...returnFocus}
        className={cn(
          'fixed inset-y-0 right-0 z-[var(--z-modal)] flex w-full max-w-[450px] flex-col border-l border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-xl)]',
          className,
        )}
        {...props}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
    )
  },
)
SheetContent.displayName = 'SheetContent'
