'use client'

import * as React from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Github, Globe, Activity, PauseCircle, Archive, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
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
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => fetchApi('/projects')
  })

  return (
    <div className="p-[var(--spacing-page-pad)] max-w-[1400px] mx-auto w-full h-full flex flex-col">
      <PageHeader 
        title="Projects" 
        description="Your portfolio of active, paused, and archived software projects."
        actions={
          <Button><Plus size={16} /> New Project</Button>
        }
      />
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-[var(--color-text-muted)] h-8 w-8" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
          <p className="text-[13px] mb-4">No projects found.</p>
          <Button variant="outline"><Plus size={16} className="mr-2" /> Add Project</Button>
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
                    <a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors flex items-center gap-1.5 text-[12px] font-medium">
                      <Github size={14} /> GitHub
                    </a>
                  )}
                  {project.deployUrl && (
                    <a href={project.deployUrl} target="_blank" rel="noreferrer" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-1.5 text-[12px] font-medium">
                      <Globe size={14} /> Live
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}