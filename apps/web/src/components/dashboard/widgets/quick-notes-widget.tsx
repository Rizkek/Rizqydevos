'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'

export function QuickNotesWidget() {
  const [note, setNote] = React.useState('')

  // Load from local storage
  React.useEffect(() => {
    const saved = localStorage.getItem('devos-quick-note')
    if (saved) setNote(saved)
  }, [])

  // Save to local storage
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value)
    localStorage.setItem('devos-quick-note', e.target.value)
  }

  return (
    <WidgetCard
      id="w-quick-notes"
      type="quick-notes"
      title="Scratchpad"
      contentClassName="p-0"
    >
      <textarea
        value={note}
        onChange={handleChange}
        placeholder="Jot down quick thoughts, markdown supported..."
        className="w-full h-full p-4 bg-transparent resize-none outline-none text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] font-mono leading-relaxed"
        spellCheck={false}
      />
    </WidgetCard>
  )
}
