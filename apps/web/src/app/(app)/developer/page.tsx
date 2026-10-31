'use client'

import { Activity, BookMarked, GitPullRequest, Lock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GithubPanel } from '@/components/developer/github-panel'
import { useGithubActivity, useGithubPullRequests, useGithubRepositories } from '@/lib/integrations'
import { formatTimestamp } from '@/lib/format'

const ROW = 'block text-[13px] p-3 rounded-lg hover:bg-[var(--color-surface-2)] focus-visible:bg-[var(--color-surface-2)] transition-colors border border-transparent hover:border-[var(--color-border-subtle)]'

export default function DeveloperPage() {
  return (
    <div className="flex-1 flex flex-col p-[var(--spacing-page-pad)] overflow-hidden h-full max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Developer</h1>
        <p className="text-[14px] text-[var(--color-text-2)] mt-1">GitHub activity, open pull requests, and repositories</p>
      </div>

      <Tabs defaultValue="activity" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mb-4">
          <TabsTrigger value="activity" className="gap-2"><Activity size={14} aria-hidden="true" /> Activity</TabsTrigger>
          <TabsTrigger value="pull-requests" className="gap-2"><GitPullRequest size={14} aria-hidden="true" /> Pull requests</TabsTrigger>
          <TabsTrigger value="repositories" className="gap-2"><BookMarked size={14} aria-hidden="true" /> Repositories</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="flex-1 overflow-hidden">
          <ActivityTab />
        </TabsContent>
        <TabsContent value="pull-requests" className="flex-1 overflow-hidden">
          <PullRequestsTab />
        </TabsContent>
        <TabsContent value="repositories" className="flex-1 overflow-hidden">
          <RepositoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ActivityTab() {
  return (
    <GithubPanel title="Activity feed" query={useGithubActivity()} loadingLabel="Loading GitHub activity" emptyText="No recent activity found.">
      {(events) => (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="flex gap-3 text-[13px] p-3 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors border border-transparent hover:border-[var(--color-border-subtle)]">
              <img src={event.actor.avatarUrl} alt="" width={32} height={32} loading="lazy" className="w-8 h-8 rounded-full border border-[var(--color-border)]" />
              <div>
                <p className="text-[var(--color-text)]">
                  <span className="font-semibold">{event.actor.login}</span> {formatEventType(event.type ?? '')} <span className="font-medium">{event.repo.name}</span>
                </p>
                {event.createdAt && (
                  <time dateTime={event.createdAt} className="block text-[var(--color-text-2)] mt-1">
                    {formatTimestamp(event.createdAt)}
                  </time>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </GithubPanel>
  )
}

function PullRequestsTab() {
  return (
    <GithubPanel title="Open pull requests involving you" query={useGithubPullRequests()} loadingLabel="Loading pull requests" emptyText="No open pull requests.">
      {(pullRequests) => (
        <ul className="space-y-2">
          {pullRequests.map((pr) => (
            <li key={pr.id}>
              <a href={pr.url} target="_blank" rel="noopener noreferrer" className={ROW}>
                <span className="block font-medium text-[var(--color-text)]">{pr.title}</span>
                <span className="block text-[var(--color-text-2)] mt-1">
                  {pr.repo.fullName}
                  {pr.author.login && <> · by {pr.author.login}</>}
                  {' · updated '}
                  <time dateTime={pr.updatedAt}>{formatTimestamp(pr.updatedAt)}</time>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </GithubPanel>
  )
}

function RepositoriesTab() {
  return (
    <GithubPanel title="Recently pushed repositories" query={useGithubRepositories()} loadingLabel="Loading repositories" emptyText="No repositories found.">
      {(repositories) => (
        <ul className="space-y-2">
          {repositories.map((repo) => (
            <li key={repo.id}>
              <a href={repo.url} target="_blank" rel="noopener noreferrer" className={ROW}>
                <span className="flex items-center gap-2 font-medium text-[var(--color-text)]">
                  {repo.fullName}
                  {repo.private && (
                    <span className="inline-flex items-center gap-1 text-[12px] font-normal text-[var(--color-text-2)]">
                      <Lock size={12} aria-hidden="true" /> Private
                    </span>
                  )}
                </span>
                {repo.description && <span className="block text-[var(--color-text-2)] mt-1">{repo.description}</span>}
                <span className="block text-[12px] text-[var(--color-text-2)] mt-1">
                  {[repo.language, `${repo.stargazersCount ?? 0} stars`].filter(Boolean).join(' · ')}
                  {repo.updatedAt && <> · updated <time dateTime={repo.updatedAt}>{formatTimestamp(repo.updatedAt)}</time></>}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </GithubPanel>
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
