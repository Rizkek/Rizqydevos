'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { fetchApi } from '@/lib/api'
import { createQueryOptions, queryKeys } from '@/lib/query'
import { attentionItems, type ChecklistItem } from '@/lib/checklist'
import { ProjectChecklist } from './project-checklist'

interface ProjectRef {
  id: string
  name: string
  status: string
}

export function ChecklistPanel() {
  const projects = useQuery(createQueryOptions(queryKeys.projects, () => fetchApi<ProjectRef[]>('/projects')))
  const checklist = useQuery(createQueryOptions(queryKeys.checklist, () => fetchApi<ChecklistItem[]>('/checklist')))
  const secrets = useQuery(createQueryOptions(queryKeys.secrets, () => fetchApi<Array<{ id: string; name: string }>>('/secrets')))

  const failed = projects.error ?? checklist.error
  const loading = projects.isLoading || checklist.isLoading
  const now = new Date()

  if (loading) return <ListSkeleton label="Loading checklist" rows={4} />
  if (failed) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 p-8 text-center text-[13px] text-[var(--color-text-2)]">
        <p>Could not load the checklist.</p>
        <Button variant="outline" size="sm" onClick={() => { void projects.refetch(); void checklist.refetch() }}>Try again</Button>
      </div>
    )
  }

  const activeProjects = (projects.data ?? []).filter((project) => project.status !== 'ARCHIVED')
  if (activeProjects.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No projects yet"
        description="The checklist is kept per project. Add a project first, then come back to list what to keep an eye on."
        action={<Button asChild variant="outline" size="sm"><Link href="/projects">Open Projects</Link></Button>}
      />
    )
  }

  const items = checklist.data ?? []
  const overdue = attentionItems(items, now)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-8 pr-1">
      <p role="status" className="text-[13px] text-[var(--color-text-2)]">
        {overdue.length === 0 ? 'Nothing is overdue or due soon.' : `${overdue.length} ${overdue.length === 1 ? 'item needs' : 'items need'} attention.`}
      </p>
      {activeProjects.map((project) => (
        <ProjectChecklist
          key={project.id}
          project={project}
          items={items.filter((item) => item.projectId === project.id)}
          secrets={secrets.data ?? []}
          now={now}
        />
      ))}
    </div>
  )
}
