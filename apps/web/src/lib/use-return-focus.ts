import * as React from 'react'

// Radix returns focus on close only to a <Dialog.Trigger>. Our dialogs are opened from state
// (a store or a button elsewhere), so without this keyboard focus falls back to the top of the page.
// The opener is read in onOpenAutoFocus, which runs before Radix moves focus into the dialog.
export function useReturnFocus() {
  const opener = React.useRef<HTMLElement | null>(null)

  return React.useMemo(
    () => ({
      onOpenAutoFocus: () => {
        opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      },
      onCloseAutoFocus: (event: Event) => {
        event.preventDefault()
        opener.current?.focus()
        opener.current = null
      },
    }),
    [],
  )
}
