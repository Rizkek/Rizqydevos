// Shared types across web and api workspaces
// Import from '@devos/types' in any workspace

// ── Auth ──────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  userId: string
  expiresAt: string
}

// ── Common ────────────────────────────────────────────

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResult<T> {
  items: T[]
  meta: PaginationMeta
}

export interface ApiResponse<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export type ApiResult<T> = ApiResponse<T> | ApiError

// ── Workspace ─────────────────────────────────────────

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Todo {
  id: string
  title: string
  description?: string
  priority: Priority
  completed: boolean
  dueDate?: string
  tags: string[]
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateTodoInput {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string
  tags?: string[]
}

export interface UpdateTodoInput extends Partial<CreateTodoInput> {
  completed?: boolean
}

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  pinned: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateNoteInput {
  title: string
  content: string
  tags?: string[]
  pinned?: boolean
}

export interface UpdateNoteInput extends Partial<CreateNoteInput> {}

// ── Knowledge ─────────────────────────────────────────

export interface Snippet {
  id: string
  title: string
  description?: string
  content: string
  language: string
  tags: string[]
  pinned: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateSnippetInput {
  title: string
  description?: string
  content: string
  language: string
  tags?: string[]
  pinned?: boolean
}

export interface UpdateSnippetInput extends Partial<CreateSnippetInput> {}

// ── Projects ──────────────────────────────────────────

export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED'

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  repoUrl?: string
  deployUrl?: string
  color?: string
  tags: string[]
  techStack: string[]
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateProjectInput {
  name: string
  description?: string
  status?: ProjectStatus
  repoUrl?: string
  deployUrl?: string
  color?: string
  tags?: string[]
  techStack?: string[]
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

// ── Settings & UI ──────────────────────────────────────

export interface UserSettings {
  id: string
  theme: string
  density: string
  accentColor: string
  sidebarOpen: boolean
  userId: string
  updatedAt: string
}

export interface UpdateSettingsInput {
  theme?: string
  density?: string
  accentColor?: string
  sidebarOpen?: boolean
}

// ── Dashboard ─────────────────────────────────────────

export type WidgetType =
  | 'tasks'
  | 'github'
  | 'pomodoro'
  | 'server-health'
  | 'docker'
  | 'quick-notes'
  | 'reading-list'
  | 'calendar'
  | 'weather'
  | 'snippets'
  | 'bookmarks'
  | 'career'
  | 'finance'
  | 'recent-deploys'
  | 'learning'
  | 'ai-assistant'

export type WidgetSize = 'SMALL' | 'MEDIUM' | 'LARGE'

export interface Widget {
  id: string
  type: WidgetType
  enabled: boolean
  position: number
  size: WidgetSize
  config?: Record<string, unknown>
}

// ── Status ────────────────────────────────────────────

export type ServiceStatus = 'online' | 'degraded' | 'offline' | 'unknown'
