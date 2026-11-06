'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'

// A bookmark whose URL is JavaScript: clicking it on any page opens /links/add with that page's address.
function bookmarkletFor(origin: string): string {
  return `javascript:(()=>{location.href='${origin}/links/add?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title)})()`
}

const subscribeNoop = () => () => {}

export function Bookmarklet() {
  const origin = React.useSyncExternalStore(subscribeNoop, () => window.location.origin, () => '')
  const [copied, setCopied] = React.useState(false)
  if (!origin) return null
  const code = bookmarkletFor(origin)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <details className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3 text-[13px] text-[var(--color-text-2)]">
      <summary className="cursor-pointer font-medium text-[var(--color-text)]">Save links from any page</summary>
      <div className="mt-3 flex flex-col gap-2">
        <p>Create a browser bookmark, paste this code as its URL, and click it on any page to save that page here.</p>
        <code className="block overflow-x-auto whitespace-nowrap rounded-[var(--radius-md)] bg-[var(--color-surface-2)] p-2 font-mono text-[12px]">{code}</code>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>Copy code</Button>
          <span role="status" className="text-[12px]">{copied ? 'Copied' : ''}</span>
        </div>
      </div>
    </details>
  )
}
