# Database

PostgreSQL (Supabase free tier in practice) accessed through Prisma 7 with `@prisma/adapter-pg`. The schema is `prisma/schema.prisma` at the repository root and is shared by the web app (Better Auth tables) and the API (everything else).

---

## 1. Models

| Area | Model | Used by | Key fields and rules |
|---|---|---|---|
| Auth | `User` (`user`) | Better Auth, all modules | `email` unique, `avatarUrl`, `timezone` (default Asia/Jakarta), `twoFactorEnabled` (set by the twoFactor plugin) |
| Auth | `Session` (`session`) | Better Auth | `token` unique, `expiresAt`; 7-day sessions |
| Auth | `Account` (`account`) | Better Auth | Holds the password hash for email sign-in; unique `[providerId, accountId]` |
| Auth | `Verification` (`verification`) | Better Auth | Password reset tokens |
| Auth | `TwoFactor` (`twoFactor`) | Better Auth twoFactor plugin | `secret` and `backupCodes`, both encrypted by the plugin; `verified`, failed attempt counter, `lockedUntil`; deleted with the user |
| Settings | `UserSettings` | API `settings` module only | theme, density, accentColor, sidebarOpen. **Not used by the web app**, which keeps these in localStorage |
| Dashboard | `Widget`, enum `WidgetSize` | Nothing | Unused: the widget layout lives in localStorage. Removing it needs a migration (open decision) |
| Workspace | `Todo`, enum `Priority` | `/workspace/todos` | priority LOW to URGENT, completed, dueDate, tags |
| Workspace | `Bookmark` | `/workspace/bookmarks` | title, url, tags, pinned; UI planned (Links, Fase B) |
| Workspace and Knowledge | `Note` | `/workspace/notes` and `/knowledge/notes` | Markdown content; the scratchpad is the note titled Scratchpad. Two APIs write the same table |
| Knowledge | `Snippet` | `/knowledge/snippets` | language, content, tags, pinned |
| Knowledge | `AiPrompt` | `/ai/prompts` | category, tags, variables (JSON), pinned, usageCount |
| Projects | `Project`, enum `ProjectStatus` | `/projects` | status ACTIVE, PAUSED, ARCHIVED; repoUrl, deployUrl (checked by Infrastructure), techStack, tags |
| Security | `Secret` | `/secrets` | `value` encrypted; `username` (empty string when none), `url`, `tags`; `category` is the type and `description` the notes; unique `[userId, key, username]` |
| Security | `ChecklistItem` | `/checklist` | title, note, done, doneAt, dueAt, repeatDays; belongs to a `Project` (cascade) and optionally links a `Secret` (set null on delete); indexes `[userId, projectId]` and `[userId, done, dueAt]` |
| Security | `AuditLog` | `AuditService`, `/audit-log` | action, resource, resourceId, metadata (JSON). Append-only |
| Integrations | `Integration` | `/integrations` | provider (github, vercel), `accessToken` encrypted, metadata (accountLogin, teamId), enabled; unique `[userId, provider]` |

## 2. Conventions

- **IDs:** `cuid()` strings. Better Auth tables use their own IDs.
- **Ownership:** every domain row has `userId` with `onDelete: Cascade`, and every query filters by it.
- **Soft delete:** `deletedAt` on Todo, Bookmark, Note, Snippet, Project, Secret, AiPrompt. Reads filter `deletedAt: null`; indexes start with `[userId, deletedAt]`.
- **Timestamps:** `createdAt` default now, `updatedAt` with `@updatedAt`.
- **Arrays and JSON:** tags and stacks are `String[]`; flexible data is `Json` (JSONB).
- **Table names:** Better Auth tables are mapped to lowercase names (`@@map`); others use the model name.

## 3. Encryption at rest

`Secret.value` and `Integration.accessToken` are encrypted by the API before storage with AES-256-GCM (`apps/api/src/shared/utils/encryption.util.ts`), format `iv:authTag:ciphertext` in hex.

- The key is `ENCRYPTION_KEY`, exactly 32 bytes. Losing or changing it makes every stored value unreadable; back it up outside the repository.
- Code before 2026-10 cut longer keys to their first 32 characters; existing data was written with that cut key.
- A database leak alone does not expose values; a leak of the database together with the key does. Client-side encryption is an open decision for Fase C.
- To change the key, run `bun run --cwd apps/api rotate-key` with the old and new key in the environment (see backend.md, Key rotation), then set `ENCRYPTION_KEY` to the new key everywhere the API runs. Take a database backup first; a decryption failure aborts before any write, but a successful rotation cannot be undone without the old key.
- The vault backup file (backend.md, Secrets) is encrypted with a passphrase, not with `ENCRYPTION_KEY`, and is the way to move secrets to a database that uses another key.

## 4. Migrations

| Task | Command (from the repository root) |
|---|---|
| Generate the client | `bunx prisma generate` (also runs on `bun install` through `postinstall`) |
| New migration in development | `bunx prisma migrate dev --name <change>` |
| Apply migrations in production | `bunx prisma migrate deploy` |
| Inspect data | `bunx prisma studio` |

- The Prisma CLI reads `DATABASE_URL` from the root `.env` (`prisma.config.ts`). On Supabase use the session pooler (port 5432) for migrations; the transaction pooler (6543) does not support them.
- Four migrations exist: `0_init`, `20261101000000_add_checklist` (creates `ChecklistItem`), `20261101010000_add_two_factor` (creates `twoFactor` and adds `user.twoFactorEnabled`), and `20261101020000_secret_v2` (adds `username`, `url`, `tags` to `Secret` and replaces the unique index with `[userId, key, username]`; existing rows get an empty username). The last three were generated offline with `prisma migrate diff` and have not been applied to any database yet; until they are, `/checklist`, two-factor sign-in, and the vault fail with database errors. They can be applied together with `bunx prisma migrate deploy`. Never edit an applied migration; add a new one.
- Migrations change shared data: the owner approves and runs them. No deployment step runs them automatically; see docs/deployment.md.

## 5. Known issues

| Issue | Plan |
|---|---|
| `Widget` unused; `UserSettings` unused by the web app | Decision pending |
| Workspace and Knowledge notes share one table without a type field | Decision pending (ROADMAP Fase A item 9) |

---

*Last updated: 2026-11-01*
*Status: Active*
