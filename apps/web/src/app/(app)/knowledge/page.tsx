'use client'

import { Suspense } from 'react'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { Code2, MessageSquareText } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingState } from '@/components/shared/loading-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SnippetsLibrary } from '@/components/knowledge/snippets-library'
import { PromptsLibrary } from '@/components/knowledge/prompts-library'

const TABS = ['snippets', 'prompts'] as const

export default function KnowledgePage() {
  return (
    <div className="p-[var(--spacing-page-pad)] max-w-[1400px] mx-auto w-full h-full flex flex-col">
      <PageHeader
        title="Knowledge"
        description="Your personal library of code snippets and prompts."
      />
      {/* The tab lives in the query string (/ai redirects to ?tab=prompts); reading it needs a Suspense boundary on a static page. */}
      <Suspense fallback={<LoadingState text="Loading knowledge…" />}>
        <KnowledgeTabs />
      </Suspense>
    </div>
  )
}

function KnowledgeTabs() {
  const [tab, setTab] = useQueryState('tab', parseAsStringLiteral(TABS).withDefault('snippets'))

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => void setTab(value === 'prompts' ? 'prompts' : 'snippets')}
      className="flex-1 flex flex-col min-h-0"
    >
      <TabsList className="mb-4 self-start">
        <TabsTrigger value="snippets" className="gap-2"><Code2 size={14} aria-hidden="true" /> Snippets</TabsTrigger>
        <TabsTrigger value="prompts" className="gap-2"><MessageSquareText size={14} aria-hidden="true" /> Prompts</TabsTrigger>
      </TabsList>
      <TabsContent value="snippets" className="flex-1 flex flex-col min-h-0">
        <SnippetsLibrary />
      </TabsContent>
      <TabsContent value="prompts" className="flex-1 flex flex-col min-h-0">
        <PromptsLibrary />
      </TabsContent>
    </Tabs>
  )
}
