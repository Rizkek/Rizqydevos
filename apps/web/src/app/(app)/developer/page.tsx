'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'
import { createQueryOptions, queryKeys } from '@/lib/query'
import { Loader2, GitPullRequest, AlertCircle, Box, Play, Square, RefreshCcw, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'


export default function DeveloperPage() {
  return (
    <div className="flex-1 flex flex-col p-[var(--spacing-page-pad)] overflow-hidden h-full max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Developer Hub</h1>
        <p className="text-[14px] text-[var(--color-text-2)] mt-1">Integrations and infrastructure tools</p>
      </div>

      <Tabs defaultValue="github" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mb-4">
          <TabsTrigger value="github" className="gap-2"><GitPullRequest size={14} /> GitHub</TabsTrigger>
          <TabsTrigger value="docker" className="gap-2"><Box size={14} /> Docker</TabsTrigger>
        </TabsList>
        
        <TabsContent value="github" className="flex-1 overflow-hidden">
          <GithubTab />
        </TabsContent>
        <TabsContent value="docker" className="flex-1 overflow-hidden">
          <DockerTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GithubTab() {
  const { data: events, isLoading, error } = useQuery(
    createQueryOptions(queryKeys.githubActivity, async () => {
      try {
        return await fetchApi<any[]>('/integrations/github/activity')
      } catch (err: any) {
        throw new Error(err.message || 'Failed to fetch GitHub activity. Ensure you have configured your token in Settings.')
      }
    })
  )

  return (
    <Card className="flex flex-col h-full bg-[var(--color-surface)] border-[var(--color-border-subtle)] overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
        <h3 className="font-medium text-[var(--color-text)] flex items-center gap-2">
          Activity Feed
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-[var(--color-text-2)] gap-2">
            <Loader2 size={16} className="animate-spin" /> Fetching activity...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] gap-3">
            <AlertCircle size={24} className="text-[var(--color-text-2)]" />
            <span className="text-[13px]">{error.message}</span>
            <Link href="/settings" className="px-3 py-1.5 text-[12px] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-3)] transition-colors">
              Configure Integration
            </Link>
          </div>
        ) : events?.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-[13px]">
            No recent activity found.
          </div>
        ) : (
          events?.map((event: any) => (
            <div key={event.id} className="flex gap-3 text-[13px] p-3 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors border border-transparent hover:border-[var(--color-border-subtle)]">
              <img src={event.actor.avatarUrl} alt={event.actor.login} className="w-8 h-8 rounded-full border border-[var(--color-border)]" />
              <div>
                <p className="text-[var(--color-text)]">
                  <span className="font-semibold">{event.actor.login}</span> {formatEventType(event.type)} <span className="font-medium">{event.repo.name}</span>
                </p>
                <p className="text-[var(--color-text-muted)] mt-1">{new Date(event.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

function DockerTab() {
  const queryClient = useQueryClient()
  const { data: containers, isLoading, error } = useQuery(
    createQueryOptions(queryKeys.dockerContainers, () => fetchApi<any[]>('/developer/docker/containers'))
  )

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string, action: string }) => 
      fetchApi(`/developer/docker/containers/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.dockerContainers })
    }
  })

  return (
    <Card className="flex flex-col h-full bg-[var(--color-surface)] border-[var(--color-border-subtle)] overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
        <h3 className="font-medium text-[var(--color-text)] flex items-center gap-2">
          Local Containers
        </h3>
        <Button variant="ghost" size="sm" onClick={() => void queryClient.invalidateQueries({ queryKey: queryKeys.dockerContainers })}>
          <RefreshCcw size={14} className="mr-2" /> Refresh
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-[var(--color-text-2)] gap-2">
            <Loader2 size={16} className="animate-spin" /> Fetching containers...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-[13px]">
            Failed to connect to local Docker daemon. Is Docker running?
          </div>
        ) : containers?.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-[13px]">
            No containers found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {containers?.map((c: any) => (
              <div key={c.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[14px] text-[var(--color-text)]">{c.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider ${
                      c.state === 'running' 
                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                        : 'bg-[var(--color-surface-3)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                    }`}>
                      {c.state}
                    </span>
                  </div>
                  <span className="text-[12px] text-[var(--color-text-2)] font-mono">{c.image}</span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">{c.status}</span>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {c.state === 'running' ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => actionMutation.mutate({ id: c.id, action: 'restart' })}>
                        <RefreshCcw size={14} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => actionMutation.mutate({ id: c.id, action: 'stop' })}>
                        <Square size={14} />
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => actionMutation.mutate({ id: c.id, action: 'start' })}>
                      <Play size={14} />
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)]" onClick={() => actionMutation.mutate({ id: c.id, action: 'remove' })}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function formatEventType(type: string) {
  switch (type) {
    case 'PushEvent': return 'pushed to'
    case 'PullRequestEvent': return 'opened a PR in'
    case 'IssuesEvent': return 'created an issue in'
    case 'CreateEvent': return 'created a branch or tag in'
    case 'WatchEvent': return 'starred'
    default: return 'interacted with'
  }
}