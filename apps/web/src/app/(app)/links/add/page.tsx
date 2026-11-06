'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingState } from '@/components/shared/loading-state'
import { Card } from '@/components/ui/card'
import { LinkForm } from '@/components/links/link-form'

// Target of the bookmarklet: /links/add?url=...&title=... opens a prefilled form.
export default function AddLinkPage() {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col p-[var(--spacing-page-pad)]">
      <PageHeader title="Save link" />
      <Suspense fallback={<LoadingState text="Loading…" />}>
        <AddLinkForm />
      </Suspense>
    </div>
  )
}

function AddLinkForm() {
  const router = useRouter()
  const params = useSearchParams()
  const url = params.get('url') ?? ''
  const title = params.get('title') ?? ''

  return (
    <Card className="p-6">
      <LinkForm
        key={url}
        initial={{ url, title, tags: [], pinned: false }}
        onSaved={() => router.push('/links')}
        onCancel={() => router.push('/links')}
      />
    </Card>
  )
}
