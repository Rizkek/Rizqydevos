'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { betterFetch } from '@better-fetch/fetch'
import { Loader2, GitPullRequest, GitCommit, GitMerge, AlertCircle, Box, Activity } from 'lucide-react'

// Define the API URL since better-fetch needs full URL or proxy will handle it
const API_URL = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api` : 'http://localhost:3000/api'

export default function DeveloperPage() {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['github-activity'],
    queryFn: async () => {
      // The API proxy or direct fetch to NestJS (NestJS is on 3001, but we can hit it directly)
      // Wait, since Next.js proxy config is not intercepting /api/v1 calls, we should call NestJS directly 
      // or we can proxy Next.js /api to NestJS.
      // Assuming CORS is set up on NestJS :3001:
      const res = await fetch('http://localhost:3001/api/v1/integrations/github/activity', {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) throw new Error('Failed to fetch GitHub activity. Ensure you have configured your token.')
      return res.json()
    }
  })

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Developer Hub</h1>
        <p className="text-[14px] text-[var(--color-text-2)] mt-1">Integrations and infrastructure</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 h-full">
        {/* GitHub Pane */}
        <Card className="flex flex-col h-full bg-[var(--color-surface)] border-[var(--color-border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
            <h3 className="font-medium text-[var(--color-text)] flex items-center gap-2">
              <GitPullRequest size={16} className="text-[var(--color-text-2)]" />
              GitHub Activity
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
                <button className="px-3 py-1.5 text-[12px] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-3)]">
                  Configure Integration
                </button>
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

        {/* Docker Pane */}
        <Card className="flex flex-col h-full bg-[var(--color-surface)] border-[var(--color-border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
            <h3 className="font-medium text-[var(--color-text)] flex items-center gap-2">
              <Box size={16} className="text-[var(--color-text-2)]" />
              Docker Containers
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-green-500/10 text-green-500 border border-green-500/20">
              DAEMON CONNECTED
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-[var(--color-text-muted)] gap-3">
             <Activity size={24} className="text-[var(--color-text-2)] opacity-50" />
             <p className="text-[13px]">Waiting for container status updates...</p>
             <p className="text-[12px] text-[var(--color-text-muted)] max-w-xs text-center">Local Docker socket integration is currently running in mock mode for Phase 3.</p>
          </div>
        </Card>
      </div>
    </div>
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