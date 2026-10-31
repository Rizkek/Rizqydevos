# Product Overview

What DevOS is, who it is for, what each module does, and how the main flows work. This is the single source for scope.

---

## 1. Purpose

DevOS is one developer's **personal space for things that are easy to lose and worth finding fast**:

1. Links and bookmarks.
2. Knowledge: code snippets, notes, and prompts.
3. Passwords and secrets the owner is afraid to lose, with encrypted backups.
4. A registry of projects: repository, deploy URL, stack, status.
5. A glance at status: GitHub activity, Vercel deployments, uptime and SSL expiry of the owner's own sites.
6. Key security points as a checklist per project.

It is not a DevOps platform, a monitoring stack, or an AI product.

**Success measure:** every module answers a question the owner asks every week. A module that answers none is removed.

## 2. Constraints

| Constraint | Consequence in code |
|---|---|
| One user | Registration is closed. Only the address in `OWNER_EMAIL` can create the account (`apps/web/src/lib/signup-policy.ts`). |
| Zero running cost | Free tiers only: Supabase (Postgres), a hosted Redis the owner already has, Vercel, Render, the GitHub and Vercel APIs. |
| Nothing that controls a host | No Docker management, no terminal, no background workers. |
| No paid AI | Prompts are stored and copied; no model is called. |

## 3. Principles

1. **Owner first.** Optimise for one developer's daily use, not for a general audience.
2. **One source of truth.** Each piece of data lives in one module; others link to it.
3. **Keyboard first.** Every action is reachable by keyboard; the command palette (Ctrl+K or Cmd+K) navigates everywhere.
4. **Private by default.** Secrets and integration tokens are encrypted at rest and never returned by the API.
5. **Honest UI.** No control without a working action, no fake data, status always has text and not only colour.
6. **Small and durable.** Prefer fewer modules that work over many placeholders; documentation follows the code.

## 4. Modules

Navigation (sidebar, mobile drawer, and command palette share one list in `apps/web/src/components/layout/nav-links.tsx`):

| Module | Route | Status | Question it answers |
|---|---|---|---|
| Dashboard | `/` | Working | What needs my attention today? |
| Projects | `/projects` | Working | What am I building, where does it live, is it active? |
| Workspace | `/workspace` | Working | What do I have to do, and what did I jot down? |
| Knowledge | `/knowledge` | Working (tabs Snippets, Prompts) | Where is that snippet or prompt I wrote before? |
| Developer | `/developer` | Working (tabs Activity, Pull requests, Repositories) | What happened on GitHub? |
| Infrastructure | `/infrastructure` | Working | Did my deploys succeed, are my sites up, when does SSL expire? |
| Security | `/security` | Working (vault and audit log); checklist planned | Where is that secret, and who touched it? |
| Settings | `/settings` | Working | Appearance and integrations |
| Links | `/links` | Planned (Fase B). Backend `workspace/bookmarks` exists | Where is that link I saved? |

Redirects kept for old bookmarks: `/ai` to `/knowledge?tab=prompts`, `/monitoring` to `/infrastructure` (`apps/web/next.config.ts`).

### Dashboard widgets

Stored per browser in localStorage (`apps/web/src/stores/widget.store.ts`), not in the database:

| Widget | Data |
|---|---|
| Tasks | `GET /workspace/todos` |
| Scratchpad (`quick-notes`) | the workspace note titled Scratchpad |
| Recent Deployments (`server-health`) | `GET /integrations/vercel/deployments` |
| GitHub Activity (`github`) | `GET /integrations/github/activity` |
| Focus Timer (`pomodoro`) | local only; keeping it is an open decision |
| Pinned Snippets (`snippets`) | `GET /knowledge/snippets` |

## 5. Business flows

### 5.1 Owner account and sign-in

1. The owner runs `OWNER_EMAIL=... OWNER_PASSWORD=... bun run --cwd apps/web create-owner` once. Any other address is rejected by a Better Auth database hook, whatever path tries to create a user.
2. Sign-in at `/login` with email and password. The session cookie lasts 7 days and refreshes daily.
3. `apps/web/src/proxy.ts` sends unauthenticated page requests to `/login?redirectTo=<path>`; after sign-in the user returns there (`safeRedirectPath` accepts internal paths only).
4. Password reset prints the reset link to the server log. There is no email provider; a CLI reset script is planned (Fase F).

### 5.2 Connecting GitHub and Vercel

1. Settings, Integrations: paste a GitHub personal access token or a Vercel token (plus Team ID for team deployments).
2. The API verifies the token with the provider before saving. A rejected token is shown on the field (`INTEGRATION_TOKEN_INVALID`).
3. The token is encrypted with `ENCRYPTION_KEY` and stored in `Integration`. The account login is saved in `metadata` and shown in Settings.
4. Dashboard, Developer, and Infrastructure read through the API. Failures carry a code (not connected, disabled, token rejected, rate limited, provider unavailable), and the UI shows the matching action: open Settings, enable, reconnect, wait, or retry.
5. Connect, enable or disable, and disconnect are written to the audit log, without the token.

Tokens are not environment variables.

### 5.3 Projects and site checks

1. Projects holds name, description, status (Active, Paused, Archived), repository URL, deploy URL, stack, and tags.
2. Infrastructure takes every project with a deploy URL (scheme optional, `https://` assumed) and checks uptime and, for HTTPS sites, SSL expiry every 60 seconds. At most 20 sites per batch. SSL expiring within 30 days is a warning.
3. A project without a deploy URL is simply not checked; the panel links to Projects.

### 5.4 Knowledge

- **Snippets:** title, description, language, code. Filter by language, search, copy to clipboard.
- **Prompts:** title, content, category, tags. Copying a prompt increments its usage count.
- **Notes:** a Markdown editor exists at `/knowledge/notes/[id]`, but no page links to it yet. Workspace and Knowledge write to the same `Note` table through two separate APIs; merging them is an open decision.

### 5.5 Workspace

- Todos with priority (Low, Medium, High, Urgent) and completion. The dashboard Tasks widget toggles the same todos.
- Scratchpad: one note titled Scratchpad, saved automatically one second after typing stops. The dashboard widget edits the same note.

### 5.6 Security vault

1. Add a secret: name, key, value, category, description. The value is encrypted with AES-256-GCM before it is stored.
2. Lists always show a masked value. Revealing a value is a separate request and is written to the audit log as `REVEAL_SECRET`.
3. Deleting a secret is a soft delete. Known issue: the same key cannot be created again afterwards (ROADMAP Fase S item 9).
4. The audit log tab lists create, update, delete, reveal, and integration events.

Before real passwords are stored, Fase C adds two-factor sign-in, re-authentication before reveal, and an encrypted export.

### 5.7 Settings

- Profile shows the signed-in user from the session.
- Appearance: theme (dark, light, system) and accent (violet, emerald, cyan, amber, rose). Stored in localStorage (`devos-ui`), not in the database.
- Integrations: see 5.2.

## 6. Non-goals

DevOS is not:

- a SaaS product or a multi-user app;
- a career, finance, or general productivity app;
- a team collaboration tool;
- a replacement for specialised tools (an IDE, a full password manager, a monitoring stack such as Grafana);
- an AI chatbot or an agent runner;
- a host controller (Docker, shells, deploy pipelines).

## 7. Known gaps

| Gap | Where it is tracked |
|---|---|
| Links UI | ROADMAP Fase B |
| Vault hardening (2FA, re-auth, export, data model v2) | ROADMAP Fase C |
| Per-project security checklist | ROADMAP Fase D |
| Production deployment and the session cookie across domains | ROADMAP Fase P |
| Knowledge notes editor has no entry point; two note APIs share one table | ROADMAP Fase A item 9 (decision) |
| `GET/PATCH /settings` and the `UserSettings` table are not used by the web app; the density setting has no effect | Not yet scheduled |

---

*Last updated: 2026-11-01*
*Status: Active*
