# DevOS

DevOS keeps links, knowledge (snippets, notes, prompts), passwords and secrets worth backing up, a registry of projects, and a glance at GitHub, Vercel, and the uptime and SSL expiry of your own sites. One user, zero running cost, no public registration.

---

## Modules

| Module | Purpose | Status |
|---|---|---|
| Dashboard | Today at a glance: needs attention, tasks, scratchpad, GitHub activity, deployments, snippets | Working |
| Projects | Repository, deploy URL, stack, status | Working |
| Workspace | Todos and scratchpad | Working |
| Knowledge | Snippets and prompts (notes editor without an entry point yet) | Working |
| Developer | GitHub activity, open pull requests, repositories | Working |
| Infrastructure | Vercel deployments, uptime and SSL expiry of project deploy URLs | Working |
| Security | Encrypted secret vault with password re-check, encrypted backup and restore, audit log, per-project checklist with due dates, two-factor sign-in (authenticator app), import from password manager CSV | Working, hardening in progress |
| Settings | Profile, appearance, GitHub and Vercel tokens | Working |
| Links | Bookmarks with tags and search, import from browser export, HTML and JSON export, link check, bookmarklet | Working |

Full description and business flows: [docs/product/overview.md](./docs/product/overview.md).

---

## Tech stack

| Layer | Technology |
|---|---|
| Monorepo | Bun workspaces, Turborepo |
| Web (`apps/web`) | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix primitives, TanStack Query, Zustand, nuqs, cmdk |
| Auth | Better Auth inside the web app: email and password, single owner (`OWNER_EMAIL`), 7-day session cookie |
| API (`apps/api`) | NestJS 11, class-validator, Pino, Throttler, Octokit (GitHub), Vercel REST |
| Data | PostgreSQL (Supabase) with Prisma 7; Redis for readiness |
| Security | AES-256-GCM for secrets and integration tokens, audit log |
| Tests | Vitest, Testing Library, Playwright with axe |
| Deployment | Web on Vercel, API on Render, `/api/v1` proxied through Next.js ([docs/deployment.md](./docs/deployment.md)). Not deployed yet |

Architecture: [docs/architecture/overview.md](./docs/architecture/overview.md).

---

## Repository layout

```
apps/web        Next.js app (pages, Better Auth, UI)
apps/api        NestJS API (/api/v1)
packages/types  Shared TypeScript types (@devos/types)
prisma          Schema and migrations, shared by web and api
docs            Product, architecture, design, standards, plans
```

---

## Getting started

Requirements: Bun 1.3+, Node 20+, a PostgreSQL database (Supabase or `docker-compose.dev.yml`), and Redis.

```bash
bun install                                   # also runs prisma generate
```

Create three env files. `.env.example` (local, not tracked) lists every variable and which program reads it:

| File | Read by | Main variables |
|---|---|---|
| `apps/api/.env` | API | `APP_URL`, `DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `ENCRYPTION_KEY` |
| `apps/web/.env` | Web | `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `API_URL` (default `http://localhost:3001`) |
| `.env` (root) | Prisma CLI | `DATABASE_URL` (session pooler, port 5432 on Supabase) |

GitHub and Vercel tokens are not environment variables: add them in Settings after signing in.

```bash
bunx prisma migrate deploy                    # apply migrations (owner approves)
bun run dev                                   # web on :3000, api on :3001
```

Create the owner account once (the only account that can exist):

```powershell
# PowerShell
$env:OWNER_EMAIL = "you@example.com"; $env:OWNER_PASSWORD = "<password>"; bun run --cwd apps/web create-owner
```

```bash
# Git Bash
OWNER_EMAIL=you@example.com OWNER_PASSWORD='<password>' bun run --cwd apps/web create-owner
```

## Signing in

There is no default account or password. The only account is the one created with the command above:

| Item | Value |
|---|---|
| Address | The `OWNER_EMAIL` used when creating the account. No other address can register |
| Password | The `OWNER_PASSWORD` used then, 8 to 128 characters. Only a hash is stored, so it cannot be looked up |
| Display name | `OWNER_NAME`, default Owner |

Open `http://localhost:3000` and sign in at `/login`. Running the command again with the same address fails with User already exists and does not change the password.

Forgot the password in development: choose Forgot password? on the sign-in page. No email is sent; the reset link is printed in the log of the web app (the terminal running `bun run dev`). Open that link and choose a new password.

Lost the authenticator app and the backup codes: run `OWNER_EMAIL=... bun run --cwd apps/web disable-owner-two-factor` against the database. It turns two-factor sign-in off and signs out every device; turn it on again in Settings.

Forgot the password in production: the link is not logged there. Run `OWNER_EMAIL=... NEW_PASSWORD=... bun run --cwd apps/web reset-owner-password` against the production database (`DATABASE_URL` set). The new password is 8 to 128 characters, and every signed-in device is signed out.

## Scripts (from the root)

| Command | What it does |
|---|---|
| `bun run dev` | Web and API in watch mode |
| `bun run build` | Production build of both apps |
| `bun run type-check` | TypeScript in every workspace |
| `bun run lint` | ESLint in web and api |
| `bun run test` | Vitest in web and api |
| `bun run --cwd apps/web test:e2e` | Playwright browser tests (after `bun run build`); pages behind sign-in run only when `E2E_EMAIL` and `E2E_PASSWORD` are set |
| `bun run --cwd apps/web create-owner` | Creates the owner account (needs `OWNER_EMAIL`, `OWNER_PASSWORD`) |
| `bun run --cwd apps/web reset-owner-password` | Sets a new owner password (needs `OWNER_EMAIL`, `NEW_PASSWORD`) |
| `bun run --cwd apps/web disable-owner-two-factor` | Turns off two-factor sign-in when the authenticator and backup codes are lost (needs `OWNER_EMAIL`) |
| `bun run --cwd apps/api rotate-key` | Re-encrypts stored secrets and tokens after an `ENCRYPTION_KEY` change |

---

## Documentation

Index: [docs/README.md](./docs/README.md). Current plan: [docs/plans/ROADMAP.md](./docs/plans/ROADMAP.md). Working rules for AI agents: [AGENTS.md](./AGENTS.md).
