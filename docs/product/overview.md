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
| Security | `/security` | Working (tabs Secrets Vault, Checklist, Backup, Audit Log; `?tab=` selects one) | Where is that secret, who touched it, and what security chores are due? |
| Settings | `/settings` | Working | Appearance and integrations |
| Links | `/links`, `/links/add` | Working | Where is that link I saved? |

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
| Needs Attention (`attention`) | `GET /checklist` plus the site checks from Infrastructure |

Widgets added in a later release appear in an existing browser without resetting its layout (the store merges the saved list with the defaults).

## 5. Business flows

### 5.1 Owner account and sign-in

1. The owner runs `OWNER_EMAIL=... OWNER_PASSWORD=... bun run --cwd apps/web create-owner` once. Any other address is rejected by a Better Auth database hook, whatever path tries to create a user.
2. Sign-in at `/login` with email and password. When two-factor sign-in is on, a second step asks for a 6-digit code from an authenticator app, or one of the backup codes. The session cookie lasts 7 days and refreshes daily.
3. `apps/web/src/proxy.ts` sends unauthenticated page requests to `/login?redirectTo=<path>`; after sign-in the user returns there (`safeRedirectPath` accepts internal paths only).
4. Password reset has no email provider. In development, Forgot password? prints the reset link to the log of the web app. In production the link is not logged; the owner runs `OWNER_EMAIL=... NEW_PASSWORD=... bun run --cwd apps/web reset-owner-password` (8 to 128 characters), which also signs out every device.

Two-factor sign-in is set up in Settings, Two-factor sign-in: enter the password, add the key or open the setup link in an authenticator app, save the backup codes (shown once), and confirm with a code. Turning it off and creating new backup codes also need the password. If the app and the codes are both lost, the owner runs `disable-owner-two-factor` (see the README). The vault shows a warning while two-factor sign-in is off.

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

### 5.4 Links

1. Add a link with a URL (a domain without a scheme gets `https://`), an optional title (the site name when empty), tags, a note, Read later (the tag `read-later`), and Pin. Only absolute http and https URLs are accepted; other schemes are refused in the form and by the API.
2. The list shows pinned links first, then newest. Search matches title, URL, and tags; tag buttons filter.
3. Import: export bookmarks from Chrome, Edge, Firefox, or Safari as an HTML file and choose it. The preview shows how many links are new, already saved, or skipped (not a web link, for example `chrome://`). Folders become tags, the original added date is kept, and a link is a duplicate when it differs from a saved one only in host case, a trailing slash, or the #fragment. Up to 2000 links per request; larger files are sent in several requests, and importing the same file again adds nothing.
4. Export as HTML (importable into any browser) or JSON.
5. Check links runs the uptime check on the links currently shown, in batches of 20. A batch the API refuses (for example one holding a localhost link) is marked Could not check.
6. Bookmarklet: the Links page shows a code snippet to save as a browser bookmark; clicking it on any page opens `/links/add?url=...&title=...` with the form filled in.

### 5.5 Knowledge

- **Snippets:** title, description, language, code. Filter by language, search, copy to clipboard.
- **Prompts:** title, content, category, tags. Copying a prompt increments its usage count.
- **Notes:** a Markdown editor exists at `/knowledge/notes/[id]`, but no page links to it yet. Workspace and Knowledge write to the same `Note` table through two separate APIs; merging them is an open decision.

### 5.6 Workspace

- Todos with priority (Low, Medium, High, Urgent) and completion. The dashboard Tasks widget toggles the same todos.
- Scratchpad: one note titled Scratchpad, saved automatically one second after typing stops. The dashboard widget edits the same note.

### 5.7 Security vault

1. Add a secret: name, key, value, and optionally username, website, type (Password, API Key, OAuth Token, Database, SSH Key), and tags. The key says what the secret is for (a site host such as github.com, or a variable name such as GITHUB_TOKEN). Key and username together are unique, so one site can hold several logins. The value is encrypted with AES-256-GCM before it is stored. A duplicate shows an error that names the username and keeps the form filled.
2. Lists always show a masked value. Revealing a value is a separate request, written to the audit log as `REVEAL_SECRET`, and needs a password entered within the last 15 minutes: when the sign-in is older, a dialog asks for the password, signs in again, and repeats the reveal.
3. A revealed value is hidden again after 30 seconds. After Copy, the clipboard is overwritten with an empty string after 30 seconds.
4. Deleting a secret is a soft delete that also wipes the stored value. Creating the same key again reuses the deleted row.
5. Backup tab: Export asks for a passphrase of at least 12 characters (typed twice) and downloads a JSON file. The file is encrypted with the passphrase alone, not with the server key, so it restores the vault on any server and cannot be opened without the passphrase. Restore adds missing keys and recovers deleted ones; a secret that is currently in the vault is never overwritten. Both need a recent sign-in and are audited as `EXPORT_SECRETS` and `IMPORT_SECRETS` with counts only.
6. The audit log tab lists create, update, delete, reveal, export, import, and integration events.
7. Changing `ENCRYPTION_KEY` re-encrypts all stored values with `bun run --cwd apps/api rotate-key` (see [architecture/database.md](../architecture/database.md)).
8. Import (Backup and import tab): choose the CSV that Chrome, Edge, Firefox, Bitwarden, 1Password, or LastPass exports. The file is read in the browser and only its rows are sent. The preview says how many are new, how many are already in the vault or repeated in the file, and why other rows cannot be imported (no password, no site, not a login). Nothing is written until Import is pressed; secrets already in the vault are never overwritten, and the import is audited with counts only. Up to 2000 rows per import. Rows get the type Password, the key is the site host, and the original note is kept. The CSV holds passwords in plain text, so the page reminds you to delete it afterwards.

Not built yet: encryption on the client (zero-knowledge) and a shorter session for the vault page; the 15-minute password check covers the second.

### 5.7.1 Security checklist

1. Each item belongs to a project and has a title, an optional note, an optional due date, an optional repeat interval in days (1 to 3650), and an optional link to a vault secret.
2. Add recommended items adds six starting items to a project (two-factor on hosting and repository accounts, key rotation, secrets kept out of the repository, backup with a tried restore, dependency check, domain renewal date). Items already present by title are skipped, so pressing it twice adds nothing.
3. Checking an item with a repeat interval sets the next due date to now plus the interval, unless the request sets a date. Unchecking clears the checked time.
4. Item state: overdue when the due date has passed (checked or not); open when unchecked; due soon when checked and due within 14 days; ok otherwise. Open items are not listed on the dashboard, so a new project's unchecked starting items do not bury the dates that matter.
5. The Needs Attention widget lists overdue and due-soon items together with sites that are offline and SSL certificates that expired or expire within 30 days. Danger entries come first. When nothing needs attention it says so.

### 5.8 Settings

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
| Vault v2 fields (username, url, tags), two-factor tables, and the checklist table exist only as migration files (`20261101010000_add_two_factor`, `20261101020000_secret_v2`); until the owner applies them, sign-in with two-factor, the vault, and import fail | [docs/deployment.md](../deployment.md) |
| Checklist table exists only as a migration file (`20261101000000_add_checklist`); until the owner applies it, `/checklist` fails | [docs/deployment.md](../deployment.md) |
| Production deployment (configuration ready, not deployed yet) | [docs/deployment.md](../deployment.md) |
| Knowledge notes editor has no entry point; two note APIs share one table | ROADMAP Fase A item 9 (decision) |
| `GET/PATCH /settings` and the `UserSettings` table are not used by the web app; the density setting has no effect | Not yet scheduled |

---

*Last updated: 2026-11-01*
*Status: Active*
