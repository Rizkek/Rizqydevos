'use client'

import * as React from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Code2, Copy, Bookmark, ExternalLink, X, Trash2, Edit2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'
import { Textarea } from '@/components/ui/textarea'
import { createQueryOptions, queryKeys } from '@/lib/query'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

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
  
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingSnippet, setEditingSnippet] = React.useState<Snippet | null>(null)
  
  // Form state
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [content, setContent] = React.useState('')
  const [language, setLanguage] = React.useState('typescript')

  const queryClient = useQueryClient()

  const { data: snippets = [], isLoading } = useQuery<Snippet[]>(
    createQueryOptions(queryKeys.snippets, () => fetchApi('/knowledge/snippets'))
  )

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Snippet>) => {
      const payload: Record<string, any> = {
        title: data.title,
        content: data.content,
        language: data.language,
      }
      if (data.description !== undefined) payload.description = data.description

      if (editingSnippet) {
        return fetchApi(`/knowledge/snippets/${editingSnippet.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      }
      return fetchApi('/knowledge/snippets', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.snippets })
      handleCloseForm()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/knowledge/snippets/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.snippets })
      handleCloseForm()
    }
  })

  const handleOpenForm = (snippet?: Snippet) => {
    if (snippet) {
      setEditingSnippet(snippet)
      setTitle(snippet.title)
      setDescription(snippet.description || '')
      setContent(snippet.content)
      setLanguage(snippet.language)
    } else {
      setEditingSnippet(null)
      setTitle('')
      setDescription('')
      setContent('')
      setLanguage('typescript')
    }
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setTimeout(() => {
      setEditingSnippet(null)
      setTitle('')
      setDescription('')
      setContent('')
      setLanguage('typescript')
    }, 200)
  }

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
          <Button onClick={() => handleOpenForm()}><Plus size={16} /> New Snippet</Button>
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
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Languages</h4>
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Search snippets..." 
              className="pl-9 bg-[var(--color-surface)] w-full max-w-md" aria-label="Search snippets" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pb-8">
            {isLoading ? (
              <div className="col-span-1 md:col-span-2 flex items-center justify-center py-12">
                <span role="status" className="text-[13px] text-[var(--color-text-2)]">Loading…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
                <p className="text-[13px] mb-4">No snippets found.</p>
                <Button variant="outline" onClick={() => handleOpenForm()}><Plus size={16} className="mr-2" /> Create Snippet</Button>
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
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-within:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 -mt-1"
                        aria-label={`Edit ${snippet.title}`}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleOpenForm(snippet);
                        }}
                      >
                        <Edit2 aria-hidden="true" size={13} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 -mt-1 mr-1"
                        aria-label={`Copy ${snippet.title}`}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(snippet.content);
                        }}
                      >
                        <Copy aria-hidden="true" size={13} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--color-border-subtle)]">
                    <Badge variant="secondary" className="h-5 text-[12px] font-mono">{snippet.language}</Badge>
                    <span className="text-[12px] text-[var(--color-text-muted)]">
                      {new Date(snippet.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Slide-over Form */}
      <Sheet open={isFormOpen} onOpenChange={(open) => { if (!open) handleCloseForm() }}>
        <SheetContent>
            <div className="h-[60px] border-b border-[var(--color-border)] flex items-center justify-between px-6 shrink-0">
              <SheetTitle className="text-[15px] font-semibold text-[var(--color-text)]">
                {editingSnippet ? 'Edit Snippet' : 'New Snippet'}
              </SheetTitle>
              <div className="flex items-center gap-2">
                {editingSnippet && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] hover:text-[var(--color-danger)]"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this snippet?')) {
                        deleteMutation.mutate(editingSnippet.id)
                      }
                    }}
                    aria-label="Delete snippet"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 aria-hidden="true" size={16} />
                  </Button>
                )}
                <Button variant="ghost" size="icon" aria-label="Close form" onClick={handleCloseForm} className="text-[var(--color-text-2)] hover:text-[var(--color-text)]">
                  <X aria-hidden="true" size={18} />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="snippet-field-1" className="text-[12px] font-medium text-[var(--color-text-2)]">Title <span className="text-[var(--color-danger)]">*</span></label>
                <Input id="snippet-field-1" 
                  placeholder="e.g. Fetch API Wrapper" 
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  className="bg-[var(--color-surface)]"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="snippet-field-2" className="text-[12px] font-medium text-[var(--color-text-2)]">Description</label>
                <Input id="snippet-field-2" 
                  placeholder="Brief explanation of what this does" 
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                  className="bg-[var(--color-surface)]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="snippet-field-3" className="text-[12px] font-medium text-[var(--color-text-2)]">Language <span className="text-[var(--color-danger)]">*</span></label>
                <Input id="snippet-field-3" 
                  placeholder="e.g. typescript, python, bash" 
                  value={language}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLanguage(e.target.value)}
                  className="bg-[var(--color-surface)]"
                />
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <label htmlFor="snippet-field-4" className="text-[12px] font-medium text-[var(--color-text-2)] flex items-center justify-between">
                  <span>Code Content <span className="text-[var(--color-danger)]">*</span></span>
                </label>
                <Textarea id="snippet-field-4" 
                  placeholder="Paste your code here..." 
                  value={content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                  className="bg-[var(--color-surface)] flex-1 min-h-[300px] font-mono text-[13px] resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-2)] flex justify-end gap-3 shrink-0">
              <Button variant="ghost" onClick={handleCloseForm}>Cancel</Button>
              <Button 
                onClick={() => saveMutation.mutate({ title, description, content, language })}
                disabled={!title || !content || !language || saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving…' : editingSnippet ? 'Save Changes' : 'Create Snippet'}
              </Button>
            </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}