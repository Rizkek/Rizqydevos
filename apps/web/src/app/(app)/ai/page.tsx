'use client'

import * as React from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Copy, Check, Sparkles, Folder, Loader2, Pin } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'
import { createQueryOptions, queryKeys } from '@/lib/query'

type AiPrompt = {
  id: string
  title: string
  content: string
  category?: string
  tags: string[]
  pinned: boolean
  usageCount: number
}

export default function AiPage() {
  const [search, setSearch] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const [showCreate, setShowCreate] = React.useState(false)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  // Create Form State
  const [newTitle, setNewTitle] = React.useState('')
  const [newContent, setNewContent] = React.useState('')
  const [newCategory, setNewCategory] = React.useState('')
  const [newTags, setNewTags] = React.useState('')

  const queryClient = useQueryClient()

  // Fetch Prompts
  const { data: prompts = [], isLoading } = useQuery<AiPrompt[]>(
    createQueryOptions(queryKeys.aiPrompts, () => fetchApi('/ai/prompts'))
  )

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<AiPrompt>) => 
      fetchApi('/ai/prompts', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.aiPrompts })
      setShowCreate(false)
      setNewTitle('')
      setNewContent('')
      setNewCategory('')
      setNewTags('')
    }
  })

  // Usage Counter Mutation
  const usageMutation = useMutation({
    mutationFn: (id: string) => 
      fetchApi(`/ai/prompts/${id}/usage`, { method: 'POST' }),
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.aiPrompts })
      const previous = queryClient.getQueryData<AiPrompt[]>(queryKeys.aiPrompts)
      if (previous) {
        queryClient.setQueryData<AiPrompt[]>(queryKeys.aiPrompts, old => 
          old?.map(p => p.id === id ? { ...p, usageCount: p.usageCount + 1 } : p)
        )
      }
      return { previous }
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.aiPrompts, context.previous)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.aiPrompts })
    }
  })

  // Derived Categories
  const categories = Array.from(new Set(prompts.filter(p => p.category).map(p => p.category!)))

  const filtered = prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.content.toLowerCase().includes(search.toLowerCase())
    const matchesCat = selectedCategory ? p.category === selectedCategory : true
    return matchesSearch && matchesCat
  })

  const handleCopy = (prompt: AiPrompt) => {
    navigator.clipboard.writeText(prompt.content)
    setCopiedId(prompt.id)
    usageMutation.mutate(prompt.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return
    
    const payload: Partial<AiPrompt> = {
      title: newTitle,
      content: newContent,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
    }
    const cat = newCategory.trim()
    if (cat) {
      payload.category = cat
    }
    createMutation.mutate(payload)
  }

  return (
    <div className="p-[var(--spacing-page-pad)] max-w-[1400px] mx-auto w-full h-full flex flex-col">
      <PageHeader 
        title="AI Prompts" 
        description="Your personal library of optimized LLM prompts and context snippets."
        actions={
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus size={16} /> New Prompt
          </Button>
        }
      />

      {/* Quick Create Inline Form */}
      {showCreate && (
        <Card className="mb-6 p-5 border-[var(--color-accent-border)] bg-[var(--color-surface-2)]">
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input 
                  placeholder="Prompt Title (e.g., Code Reviewer Persona)" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="bg-[var(--color-surface)]"
                  autoFocus
                />
              </div>
              <Input 
                placeholder="Category (e.g., Coding)" 
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="bg-[var(--color-surface)]"
              />
            </div>
            <textarea
              placeholder="Write your prompt content here..."
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              className="w-full h-32 p-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)] text-[13px] resize-none"
            />
            <div className="flex justify-between items-center">
              <Input 
                placeholder="Tags (comma separated)" 
                value={newTags}
                onChange={e => setNewTags(e.target.value)}
                className="w-1/2 bg-[var(--color-surface)]"
              />
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || !newTitle.trim() || !newContent.trim()}>
                  {createMutation.isPending && <Loader2 size={14} className="mr-2 animate-spin" />} Save Prompt
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden min-h-0 mt-4">
        
        {/* Sidebar Nav */}
        <div className="flex flex-col gap-4">
          <Card className="p-2 flex flex-col gap-1 bg-transparent border-transparent shadow-none">
            <Button 
              variant={selectedCategory === null ? 'secondary' : 'ghost'} 
              className="justify-start w-full"
              onClick={() => setSelectedCategory(null)}
            >
              <Sparkles size={16} className="text-[var(--color-accent)] mr-2" /> All Prompts
            </Button>
            {categories.map(cat => (
              <Button 
                key={cat}
                variant={selectedCategory === cat ? 'secondary' : 'ghost'} 
                className="justify-start w-full"
                onClick={() => setSelectedCategory(cat)}
              >
                <Folder size={16} className="text-[var(--color-text-2)] mr-2" /> {cat}
              </Button>
            ))}
          </Card>
        </div>
        
        {/* Content Area */}
        <div className="lg:col-span-3 flex flex-col overflow-hidden h-[calc(100vh-160px)]">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] h-4 w-4" />
            <Input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search prompts..." 
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
                <p className="text-[13px] mb-4">No AI prompts found.</p>
                <Button variant="outline" onClick={() => setShowCreate(true)}>
                  <Plus size={16} className="mr-2" /> Create Prompt
                </Button>
              </div>
            ) : (
              filtered.map(prompt => (
                <Card key={prompt.id} className="flex flex-col p-5 group hover:border-[var(--color-border-strong)] hover:shadow-md transition-all cursor-pointer relative overflow-hidden bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-2)]">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {prompt.pinned && <Pin size={12} className="text-[var(--color-accent)]" />}
                      <h3 className="text-[15px] font-bold text-[var(--color-text)] leading-tight">{prompt.title}</h3>
                    </div>
                    <Button 
                      variant={copiedId === prompt.id ? 'default' : 'secondary'}
                      size="icon" 
                      className={`h-7 w-7 transition-all ${copiedId === prompt.id ? 'bg-[var(--color-success)] text-white' : 'opacity-0 group-hover:opacity-100'} -mt-1 -mr-1`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(prompt);
                      }}
                    >
                      {copiedId === prompt.id ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                  </div>
                  
                  <div className="flex-1 text-[13px] text-[var(--color-text-2)] font-mono leading-relaxed line-clamp-3 mb-4 bg-black/20 p-3 rounded-md border border-[var(--color-border-subtle)]">
                    {prompt.content}
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-2">
                      {prompt.category && (
                        <Badge variant="secondary" className="h-5 text-[10px] uppercase font-bold tracking-wider">{prompt.category}</Badge>
                      )}
                      <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 font-medium">
                        <Sparkles size={12} /> {prompt.usageCount} uses
                      </span>
                    </div>
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