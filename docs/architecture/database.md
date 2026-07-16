# Database Architecture

This document defines the database design principles, schema strategy,
and data model overview for DevOS.

Reference: [Backend Architecture](./backend.md) | [Module Breakdown](../product/module-breakdown.md)

---

## Technology Decisions

| Concern | Technology | Reason |
|---------|-----------|--------|
| Primary Database | PostgreSQL 17 | Reliable, JSONB support, full-text search, mature |
| ORM | Prisma 6 | Type-safe, great DX, auto-generated migrations |
| Cache | Redis 7 | Session store, query cache, queue backend |
| Search | Meilisearch | Self-hosted, typo-tolerant, instant search |
| ID Strategy | CUID2 | URL-safe, non-sequential, collision-resistant |

---

## Schema Principles

1. **Every model has**: `id String @id @default(cuid())`, `createdAt`, `updatedAt`
2. **Sensitive data uses soft deletes**: `deletedAt DateTime?` — never hard delete user content
3. **All FK columns are indexed** — Prisma does not auto-index FK columns
4. **JSONB for flexible metadata** — use `Json?` for widget config, settings, extra props
5. **Enums for fixed sets** — never store magic strings for status fields
6. **Composite indexes** for common query patterns (e.g., `userId + completed`)

---

## Schema Overview

```
User ──────────────────────────────────────────────────────┐
  │                                                         │
  ├── Todo                  Workspace > Todo                │
  ├── KanbanBoard           Workspace > Kanban              │
  ├── Note                  Workspace > Notes               │
  ├── Bookmark              Workspace > Bookmarks           │
  ├── CalendarEvent         Workspace > Calendar            │
  │                                                         │
  ├── Snippet               Knowledge > Snippets            │
  ├── LearningGoal          Knowledge > Learning            │
  ├── ReadingItem           Knowledge > Reading List        │
  │                                                         │
  ├── Project               Projects module                 │
  │     └── ProjectTask     Projects > Board                │
  │                                                         │
  ├── ApiCollection         Developer > API                 │
  │     └── ApiRequest      Developer > API                 │
  │                                                         │
  ├── SshConnection         Developer > SSH                 │
  │                                                         │
  ├── Secret                Security > Secrets              │
  ├── AuditLog              Security > Audit Log            │
  │                                                         │
  ├── Widget                Dashboard config                │
  ├── UserSettings          Settings                        │
  ├── Integration           Settings > Integrations         │
  │                                                         │
  ├── AiPrompt              AI > Prompt Library             │
  ├── AiAgent               AI > Agents                     │
  └── AiConversation        AI > Chat                       │
       └── AiMessage        AI > Chat messages              │
                                                            │
Session ─────────────────────────────────────────────────--┘
Account (OAuth)
```

---

## Core Models

### User

```prisma
model User {
  id          String    @id @default(cuid())
  name        String
  email       String    @unique
  avatarUrl   String?
  timezone    String    @default("Asia/Jakarta")

  // Relations
  sessions    Session[]
  accounts    Account[]
  settings    UserSettings?
  widgets     Widget[]
  auditLogs   AuditLog[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Workspace — Todo

```prisma
model Todo {
  id          String      @id @default(cuid())
  title       String
  description String?
  priority    Priority    @default(MEDIUM)
  completed   Boolean     @default(false)
  dueDate     DateTime?
  tags        String[]
  deletedAt   DateTime?

  userId      String
  user        User        @relation(fields: [userId], references: [id])

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([userId])
  @@index([userId, completed])
  @@index([userId, deletedAt])
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### Knowledge — Snippet

```prisma
model Snippet {
  id          String    @id @default(cuid())
  title       String
  description String?
  content     String
  language    String    // 'typescript', 'python', 'bash', etc.
  tags        String[]
  pinned      Boolean   @default(false)
  deletedAt   DateTime?

  userId      String
  user        User      @relation(fields: [userId], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@index([userId, language])
}
```

### Dashboard — Widget

```prisma
model Widget {
  id          String    @id @default(cuid())
  type        String    // 'tasks', 'github', 'pomodoro', 'docker', etc.
  enabled     Boolean   @default(true)
  position    Int       // grid position index
  size        WidgetSize @default(MEDIUM)
  config      Json?     // widget-specific settings (JSONB)

  userId      String
  user        User      @relation(fields: [userId], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([userId, type])
  @@index([userId, enabled])
}

enum WidgetSize {
  SMALL
  MEDIUM
  LARGE
}
```

### Security — Secret

```prisma
model Secret {
  id          String    @id @default(cuid())
  name        String    // human-readable name
  key         String    // the key identifier
  value       String    // encrypted at application level before storing
  category    String?   // 'api-key', 'oauth', 'database', etc.
  description String?
  deletedAt   DateTime?

  userId      String
  user        User      @relation(fields: [userId], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@unique([userId, key])
}
```

### Security — Audit Log

```prisma
model AuditLog {
  id          String    @id @default(cuid())
  action      String    // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
  resource    String    // 'todo', 'secret', 'snippet', etc.
  resourceId  String?   // ID of the affected resource
  metadata    Json?     // additional context (old value, new value, IP, etc.)
  ipAddress   String?
  userAgent   String?

  userId      String
  user        User      @relation(fields: [userId], references: [id])

  createdAt   DateTime  @default(now())

  @@index([userId])
  @@index([userId, action])
  @@index([userId, resource])
  // Note: AuditLog is NEVER soft-deleted or updated — append only
}
```

### Settings — Integration

```prisma
model Integration {
  id           String    @id @default(cuid())
  provider     String    // 'github', 'vercel', 'cloudflare', 'supabase', etc.
  accessToken  String?   // encrypted
  refreshToken String?   // encrypted
  expiresAt    DateTime?
  metadata     Json?     // provider-specific data (username, org, etc.)
  enabled      Boolean   @default(true)

  userId       String
  user         User      @relation(fields: [userId], references: [id])

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([userId, provider])
  @@index([userId])
}
```

### AI — Prompt Library

```prisma
model AiPrompt {
  id          String    @id @default(cuid())
  title       String
  content     String
  category    String?   // 'coding', 'review', 'explain', 'refactor', etc.
  tags        String[]
  variables   Json?     // template variables: [{ name, description }]
  pinned      Boolean   @default(false)
  usageCount  Int       @default(0)
  deletedAt   DateTime?

  userId      String
  user        User      @relation(fields: [userId], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@index([userId, category])
}
```

---

## Migration Strategy

```
prisma/
├── schema.prisma           ← Single source of truth
└── migrations/
    ├── 20260717000000_init/
    │   └── migration.sql
    ├── 20260717000001_add_widgets/
    │   └── migration.sql
    └── ...
```

**Rules:**
- Never edit an existing migration file — create a new one
- Migration names are descriptive: `add_widget_size_field`, not `migration_1`
- Run `prisma migrate dev` in development only
- Run `prisma migrate deploy` in production CI/CD (never `migrate dev`)
- Always review the generated SQL before applying
- Test migrations on a copy of production data before deploying

---

## Query Optimization

### Always Use Indexes For

```prisma
// High-frequency query patterns get composite indexes
@@index([userId, createdAt])        // time-sorted user data
@@index([userId, completed])        // filtered todo lists
@@index([userId, deletedAt])        // soft-delete filtering
@@index([userId, type, enabled])    // widget config lookup
```

### Pagination

```typescript
// Always use cursor-based pagination for large datasets
const items = await prisma.todo.findMany({
  where: { userId, deletedAt: null },
  cursor: cursor ? { id: cursor } : undefined,
  take: limit + 1, // fetch one extra to check if there's a next page
  skip: cursor ? 1 : 0,
  orderBy: { createdAt: 'desc' },
})

const hasNextPage = items.length > limit
const data = hasNextPage ? items.slice(0, -1) : items
const nextCursor = hasNextPage ? data[data.length - 1].id : null
```

### Select Only What You Need

```typescript
// ❌ Never fetch all columns when only a few are needed
await prisma.user.findMany()

// ✅ Select only required fields
await prisma.user.findMany({
  select: { id: true, name: true, email: true },
})
```

---

## Secrets Encryption

The `Secret.value` and all `accessToken`/`refreshToken` fields in `Integration`
are **encrypted at the application layer** before being stored in the database.

Encryption: AES-256-GCM using an application-level key from environment variables.

```typescript
// The encryption key is NEVER stored in the database
// It comes only from: process.env.ENCRYPTION_KEY
```

This means even if the database is compromised, secrets remain encrypted.

---

*Last updated: 2026-07-17*
*Status: Foundation*
