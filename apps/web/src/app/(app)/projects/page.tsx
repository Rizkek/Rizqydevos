'use client'

import * as React from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Code, Globe, Activity, PauseCircle, Archive, Loader2, X, Trash2, Edit2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { fetchApi } from '@/lib/api'

type Project = {
  id: string
  name: string
  description?: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  repoUrl?: string
  deployUrl?: string
  techStack: string[]
}

export default function ProjectsPage() {
  const queryClient = useQueryClient()
  
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)
  
  // Form state
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [status, setStatus] = React.useState<Project['status']>('ACTIVE')
  const [repoUrl, setRepoUrl] = React.useState('')
  const [deployUrl, setDeployUrl] = React.useState('')
  const [techStackStr, setTechStackStr] = React.useState('')

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => fetchApi('/projects')
  })

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Project>) => {
      const payload = {
        ...data,
        techStack: techStackStr.split(',').map(s => s.trim()).filter(Boolean)
      }
      if (editingProject) {
        return fetchApi(`/projects/${editingProject.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      }
      return fetchApi('/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      handleCloseForm()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      handleCloseForm()
    }
  })

  const handleOpenForm = (project?: Project) => {
    if (project) {
      setEditingProject(project)
      setName(project.name)
      setDescription(project.description || '')
      setStatus(project.status)
      setRepoUrl(project.repoUrl || '')
      setDeployUrl(project.deployUrl || '')
      setTechStackStr(project.techStack.join(', '))
    } else {
      setEditingProject(null)
      setName('')
      setDescription('')
      setStatus('ACTIVE')
      setRepoUrl('')
      setDeployUrl('')
      setTechStackStr('')
    }
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setTimeout(() => {
      setEditingProject(null)
      setName('')
      setDescription('')
      setStatus('ACTIVE')
      setRepoUrl('')
      setDeployUrl('')
      setTechStackStr('')
    }, 200)
  }

  return (
    <div className="p-[var(--spacing-page-pad)] max-w-[1400px] mx-auto w-full h-full flex flex-col">
      <PageHeader 
        title="Projects" 
        description="Your portfolio of active, paused, and archived software projects."
        actions={
          <Button onClick={() => handleOpenForm()}><Plus size={16} /> New Project</Button>
        }
      />
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-[var(--color-text-muted)] h-8 w-8" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
          <p className="text-[13px] mb-4">No projects found.</p>
          <Button variant="outline" onClick={() => handleOpenForm()}><Plus size={16} className="mr-2" /> Add Project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-12 mt-4">
          {projects.map(project => (
            <Card key={project.id} className="flex flex-col overflow-hidden hover:border-[var(--color-border-strong)] transition-colors group">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-[16px] font-bold text-[var(--color-text)] tracking-tight">{project.name}</h3>
                  <Badge 
                    variant={project.status === 'ACTIVE' ? 'success' : project.status === 'PAUSED' ? 'warning' : 'secondary'} 
                    className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 h-5 flex items-center gap-1"
                  >
                    {project.status === 'ACTIVE' && <Activity size={10} />}
                    {project.status === 'PAUSED' && <PauseCircle size={10} />}
                    {project.status === 'ARCHIVED' && <Archive size={10} />}
                    {project.status}
                  </Badge>
                </div>
                <p className="text-[13px] text-[var(--color-text-2)] mb-5 leading-relaxed line-clamp-2">
                  {project.description || 'No description provided.'}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.techStack.map(t => (
                    <Badge key={t} variant="outline" className="text-[11px] font-medium text-[var(--color-text-muted)] border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="bg-[var(--color-surface-2)]/50 border-t border-[var(--color-border-subtle)] p-3 px-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {project.repoUrl && (
                    <a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors flex items-center gap-1.5 text-[12px] font-medium" onClick={(e) => e.stopPropagation()}>
                      <Code size={14} /> Code
                    </a>
                  )}
                  {project.deployUrl && (
                    <a href={project.deployUrl} target="_blank" rel="noreferrer" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-1.5 text-[12px] font-medium" onClick={(e) => e.stopPropagation()}>
                      <Globe size={14} /> Live
                    </a>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleOpenForm(project);
                    }}
                  >
                    <Edit2 size={13} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Slide-over Form */}
      {isFormOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[40]" 
            onClick={handleCloseForm}
          />
          <div className="fixed top-0 right-0 h-full w-[450px] bg-[var(--color-bg)] border-l border-[var(--color-border)] shadow-2xl z-[50] flex flex-col animate-in slide-in-from-right duration-200">
            <div className="h-[60px] border-b border-[var(--color-border)] flex items-center justify-between px-6 shrink-0">
              <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
                {editingProject ? 'Edit Project' : 'New Project'}
              </h2>
              <div className="flex items-center gap-2">
                {editingProject && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] hover:text-[var(--color-danger)]"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this project?')) {
                        deleteMutation.mutate(editingProject.id)
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleCloseForm} className="text-[var(--color-text-2)] hover:text-[var(--color-text)]">
                  <X size={18} />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-[var(--color-text-2)]">Name <span className="text-[var(--color-danger)]">*</span></label>
                <Input 
                  placeholder="e.g. Acme Website" 
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  className="bg-[var(--color-surface)]"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-[var(--color-text-2)]">Status</label>
                <select 
                  value={status} 
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as any)}
                  className="w-full h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-border-strong)]"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-[var(--color-text-2)]">Description</label>
                <Textarea 
                  placeholder="Brief description" 
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  className="bg-[var(--color-surface)] min-h-[80px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-[var(--color-text-2)]">Repository URL</label>
                <Input 
                  placeholder="https://github.com/..." 
                  value={repoUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepoUrl(e.target.value)}
                  className="bg-[var(--color-surface)]"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-[var(--color-text-2)]">Deploy URL</label>
                <Input 
                  placeholder="https://..." 
                  value={deployUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeployUrl(e.target.value)}
                  className="bg-[var(--color-surface)]"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-[var(--color-text-2)]">Tech Stack (comma separated)</label>
                <Input 
                  placeholder="React, NestJS, Prisma" 
                  value={techStackStr}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTechStackStr(e.target.value)}
                  className="bg-[var(--color-surface)]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-2)] flex justify-end gap-3 shrink-0">
              <Button variant="ghost" onClick={handleCloseForm}>Cancel</Button>
              <Button 
                onClick={() => saveMutation.mutate({ name, description, status, repoUrl, deployUrl })}
                disabled={!name || saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                {editingProject ? 'Save Changes' : 'Create Project'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}