'use client'

import * as React from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Code2, Copy, Bookmark, ExternalLink } from 'lucide-react'

const mockSnippets = [
  { id: '1', title: 'React Query Boilerplate', lang: 'typescript', desc: 'Standard setup for query client in Next.js App Router.', date: '2 days ago' },
  { id: '2', title: 'Dockerfile for Node 22', lang: 'dockerfile', desc: 'Multi-stage build for NestJS with pnpm.', date: '1 week ago' },
  { id: '3', title: 'Prisma Seed Script', lang: 'typescript', desc: 'Robust seeding with upserts and relations.', date: '1 month ago' },
  { id: '4', title: 'Tailwind V4 Config', lang: 'css', desc: 'Design tokens mapped to CSS variables for UI store.', date: '2 months ago' },
]

export default function KnowledgePage() {
  const [search, setSearch] = React.useState('')
  const filtered = mockSnippets.filter(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-[var(--spacing-page-pad)] max-w-[1400px] mx-auto w-full h-full flex flex-col">
      <PageHeader 
        title="Knowledge Base" 
        description="Your personal library of code snippets, bookmarks, and learning notes."
        actions={
          <Button><Plus size={16} /> New Snippet</Button>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden min-h-0">
        
        {/* Sidebar Nav */}
        <div className="flex flex-col gap-4">
          <Card className="p-2 flex flex-col gap-1 bg-transparent border-transparent shadow-none">
            <Button variant="secondary" className="justify-start w-full">
              <Code2 size={16} className="text-[var(--color-accent)]" /> Snippets
            </Button>
            <Button variant="ghost" className="justify-start w-full">
              <Bookmark size={16} className="text-[var(--color-text-2)]" /> Bookmarks
            </Button>
            <Button variant="ghost" className="justify-start w-full">
              <ExternalLink size={16} className="text-[var(--color-text-2)]" /> Reading List
            </Button>
          </Card>
          
          <div className="px-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Languages</h4>
            <div className="flex flex-wrap gap-2">
              {['typescript', 'css', 'dockerfile', 'python', 'go'].map(lang => (
                <Badge key={lang} variant="outline" className="cursor-pointer hover:bg-[var(--color-surface-2)]">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="lg:col-span-3 flex flex-col overflow-hidden h-[calc(100vh-160px)]">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] h-4 w-4" />
            <Input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search snippets..." 
              className="pl-9 bg-[var(--color-surface)] w-full max-w-md"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pb-8">
            {filtered.map(snippet => (
              <Card key={snippet.id} className="p-4 flex flex-col gap-3 group hover:border-[var(--color-border-strong)] transition-colors cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[var(--color-text)] leading-tight mb-1">{snippet.title}</h3>
                    <p className="text-[13px] text-[var(--color-text-2)] line-clamp-2 leading-relaxed">{snippet.desc}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 -mt-1 -mr-1">
                    <Copy size={14} />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--color-border-subtle)]">
                  <Badge variant="secondary" className="h-5 text-[10px] font-mono">{snippet.lang}</Badge>
                  <span className="text-[11px] text-[var(--color-text-muted)]">{snippet.date}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}