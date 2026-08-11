'use client'

import * as React from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Code2, Copy, Bookmark, ExternalLink, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'

type Snippet = {
  id: string
  title: string
  description?: string
  content: string
  language: string
  tags: string[]
  createdAt: string
}

export default function KnowledgePage() {
  const [search, setSearch] = React.useState('')
  const [selectedLang, setSelectedLang] = React.useState<string | null>(null)

  const { data: snippets = [], isLoading } = useQuery<Snippet[]>({
    queryKey: ['snippets'],
    queryFn: () => fetchApi('/knowledge/snippets')
  })

  // Derive available languages from the snippets
  const languages = Array.from(new Set(snippets.map(s => s.language)))

  const filtered = snippets.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                          (s.description || '').toLowerCase().includes(search.toLowerCase())
    const matchesLang = selectedLang ? s.language === selectedLang : true
    return matchesSearch && matchesLang
  })

  return (
    <div className="p-[var(--spacing-page-pad)] max-w-[1400px] mx-auto w-full h-full flex flex-col">
      <PageHeader 
        title="Knowledge Base" 
        description="Your personal library of code snippets, bookmarks, and learning notes."
        actions={
          <Button><Plus size={16} /> New Snippet</Button>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden min-h-0 mt-4">
        
        {/* Sidebar Nav */}
        <div className="flex flex-col gap-4">
          <Card className="p-2 flex flex-col gap-1 bg-transparent border-transparent shadow-none">
            <Button variant="secondary" className="justify-start w-full">
              <Code2 size={16} className="text-[var(--color-accent)] mr-2" /> Snippets
            </Button>
            <Button variant="ghost" className="justify-start w-full">
              <Bookmark size={16} className="text-[var(--color-text-2)] mr-2" /> Bookmarks
            </Button>
            <Button variant="ghost" className="justify-start w-full">
              <ExternalLink size={16} className="text-[var(--color-text-2)] mr-2" /> Reading List
            </Button>
          </Card>
          
          <div className="px-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Languages</h4>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={selectedLang === null ? 'default' : 'outline'} 
                className="cursor-pointer hover:bg-[var(--color-surface-2)]"
                onClick={() => setSelectedLang(null)}
              >
                All
              </Badge>
              {languages.map(lang => (
                <Badge 
                  key={lang} 
                  variant={selectedLang === lang ? 'default' : 'outline'} 
                  className="cursor-pointer hover:bg-[var(--color-surface-2)]"
                  onClick={() => setSelectedLang(lang)}
                >
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
            {isLoading ? (
              <div className="col-span-1 md:col-span-2 flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-[var(--color-text-muted)] h-8 w-8" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
                <p className="text-[13px] mb-4">No snippets found.</p>
                <Button variant="outline"><Plus size={16} className="mr-2" /> Create Snippet</Button>
              </div>
            ) : (
              filtered.map(snippet => (
                <Card key={snippet.id} className="p-4 flex flex-col gap-3 group hover:border-[var(--color-border-strong)] transition-colors cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-[14px] font-semibold text-[var(--color-text)] leading-tight mb-1">{snippet.title}</h3>
                      <p className="text-[13px] text-[var(--color-text-2)] line-clamp-2 leading-relaxed">{snippet.description || 'No description'}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 -mt-1 -mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(snippet.content);
                      }}
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--color-border-subtle)]">
                    <Badge variant="secondary" className="h-5 text-[10px] font-mono">{snippet.language}</Badge>
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      {new Date(snippet.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}