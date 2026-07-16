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
  createdAt: string
  updatedAt: string
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
