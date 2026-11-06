# Deployment

How DevOS runs in production: the web app on Vercel, the API on Render, Postgres on Supabase, and a hosted Redis. All on free tiers. The owner performs every step; nothing here deploys automatically from an agent.

---

## 1. Topology

```
Browser ──> Vercel (apps/web, Next.js)
              ├── pages and /api/auth/*  (Better Auth, sets the session cookie on the Vercel domain)
              └── /api/v1/*  ──rewrite──> Render (apps/api, NestJS) ──> Supabase Postgres, Redis
                                            └── AuthGuard calls <BETTER_AUTH_URL>/api/auth/get-session
```

The browser never calls Render directly. `apps/web/next.config.ts` rewrites `/api/v1/*` to `API_URL`, so the session cookie, which belongs to the Vercel domain, travels with every API call. Calling the API on its own domain would not work: `*.vercel.app` and `*.onrender.com` are different sites and the browser would not send the cookie.

## 2. Configuration files

| File                        | Purpose                                                                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `render.yaml`             | Render blueprint for the API: build from the repository root with Bun, start `node apps/api/dist/main.js`, health check `/api/v1/health`, builds only when API-related paths change |
| `apps/web/vercel.json`    | Vercel install and build from the repository root (Bun workspaces and `prisma generate` need the root)                                                                                |
| `apps/web/next.config.ts` | `/api/v1/*` rewrite to `API_URL`; redirects for old routes                                                                                                                          |
| `.github/workflows/ci.yml` | Pull requests and pushes to `main`: type-check, lint, unit tests, build, and the Playwright public-page tests, with placeholder environment values. `bun audit` runs but does not block. Not run on GitHub yet |
| `prisma/migrations/`      | Schema changes, applied with `bunx prisma migrate deploy` (`0_init`, `20261101000000_add_checklist`, `20261101010000_add_two_factor`, `20261101020000_secret_v2`)                                                                                                                             |

## 3. Environment variables

Set them in each dashboard. Values are secrets: never commit them.

| Variable                                          | Vercel (web) | Render (api)         | Value                                                                                                                                     |
| ------------------------------------------------- | ------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                  | yes          | yes                  | Supabase connection string. Transaction pooler (port 6543) suits Vercel's short-lived functions **[verify with Prisma adapter-pg]** |
| `BETTER_AUTH_SECRET`                            | yes          | yes                  | Random, at least 32 characters (`openssl rand -base64 32`)                                                                              |
| `BETTER_AUTH_URL`                               | yes          | yes                  | The Vercel production URL, for example `https://<project>.vercel.app`                                                                   |
| `API_URL`                                       | yes          |                      | The Render URL, for example `https://devos-api.onrender.com`. Read at build time: redeploy the web app after changing it                |
| `APP_URL`                                       |              | yes                  | The Vercel production URL (CORS)                                                                                                          |
| `REDIS_URL`                                     |              | yes                  | Hosted Redis, `rediss://...`                                                                                                            |
| `ENCRYPTION_KEY`                                |              | yes                  | Exactly 32 bytes. Use the same key as the data was written with; a new key makes stored secrets unreadable                                |
| `NODE_ENV`, `LOG_LEVEL`, `TRUST_PROXY_HOPS` |              | from `render.yaml` | `production`, `info`, `1`                                                                                                           |

`OWNER_EMAIL` is not needed in production; it is only read while creating the owner account.

## 4. First deployment

1. **Database.** With the root `.env` pointing at Supabase (session pooler, port 5432), run `bunx prisma migrate deploy` from the repository root. This applies all four migrations: the Checklist table, the two-factor table and column, and the new vault columns. The Security checklist, the Needs Attention widget, two-factor sign-in, and the vault fail until it has run. Run it before the new web and API versions are live.
2. **API on Render.** New, Blueprint, select the repository; Render reads `render.yaml`. Fill the `sync: false` variables (`APP_URL` and `BETTER_AUTH_URL` can be set after step 3). Note the service URL.
3. **Web on Vercel.** Import the repository, set Root Directory to `apps/web`, keep the Next.js preset (install and build come from `vercel.json`). Add the web variables, including `API_URL` from step 2, then deploy. Note the production URL.
4. **Connect the two.** On Render set `APP_URL` and `BETTER_AUTH_URL` to the Vercel URL and redeploy the API.
5. **Owner account.** If production uses a different database than local development, run `create-owner` once with that database:

   ```powershell
   $env:DATABASE_URL = "<production url>"; $env:OWNER_EMAIL = "you@example.com"; $env:OWNER_PASSWORD = "<password>"; bun run --cwd apps/web create-owner
   ```
6. **Forgotten password.** The reset link is not logged in production and no email is sent. Run the reset script against the production database:

   ```powershell
   $env:DATABASE_URL = "<production url>"; $env:OWNER_EMAIL = "you@example.com"; $env:NEW_PASSWORD = "<new password>"; bun run --cwd apps/web reset-owner-password
   ```

   The password is 8 to 128 characters and every signed-in device is signed out.

   If the authenticator app and the backup codes are both lost, run `$env:DATABASE_URL = "<production url>"; $env:OWNER_EMAIL = "you@example.com"; bun run --cwd apps/web disable-owner-two-factor` and turn it on again in Settings.
7. **Smoke test** (section 6).

Later deployments: push to `main`. Vercel rebuilds the web app; Render rebuilds the API when API paths change. Run `bunx prisma migrate deploy` yourself before pushing code that needs a new migration.

## 5. Free tier behaviour

- **Render Free sleeps** after a period without requests and takes tens of seconds to wake up **[verify the current limits in the Render docs]**. While it wakes, the Vercel proxy answers 502 or 504 without the API's JSON body. `fetchApi` reports that as `API_UNAVAILABLE`, queries retry up to five times with growing delays (about 30 seconds in total), and the UI says the API is starting.
- If the first request still fails, the proxy timeout on Vercel may be shorter than the wake-up time **[verify]**; retrying after a few seconds succeeds once the API is up.
- Keeping the API awake with a periodic ping to `/api/v1/health` is possible but not configured; check Render's terms and free hours first.
- **Supabase Free** can pause a project after a long time without activity **[verify]**.

## 6. Smoke test

1. Open the Vercel URL: you are sent to `/login`.
2. Sign in with the owner account; the dashboard loads.
3. Open Projects: data loads (proves the `/api/v1` rewrite carries the cookie). A 401 loop means the cookie does not reach the API: check `API_URL` and `BETTER_AUTH_URL`.
4. `https://<render-url>/api/v1/health/readiness` answers `ready` (database and Redis reachable).
5. Settings: connect GitHub and Vercel; Developer and Infrastructure show data.
6. Security: add a test secret, reveal it, delete it; the audit log lists the reveal.
7. Settings, Two-factor sign-in: turn it on with an authenticator app, sign out, and sign in again with the code. Security: the warning about two-factor disappears.
8. Security, Checklist: pick a project, add the recommended items, check one with a repeat interval; the dashboard Needs Attention widget lists items that are overdue or due within 14 days.
9. Infrastructure: a project whose deploy URL points to a private address (for example `http://169.254.169.254`) is refused with a message instead of being fetched.

## 7. Troubleshooting

| Symptom                                               | Likely cause                                                                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| API fails to start with Invalid environment variables | A required variable is missing, or `ENCRYPTION_KEY` is not exactly 32 bytes                                     |
| Every page shows The DevOS API is starting            | Render is asleep or down; check the Render logs                                                                   |
| Signed in, but every API call returns 401             | `BETTER_AUTH_URL` on Render does not point to the Vercel app, or the web app was built with a wrong `API_URL` |
| Rate limits hit quickly                               | All requests come through Vercel; `TRUST_PROXY_HOPS` decides which address counts as the client                 |
| Stored secrets cannot be read (`TOKEN_UNREADABLE`)  | `ENCRYPTION_KEY` differs from the key the data was written with                                                 |

---

*Last updated: 2026-11-01*
*Status: Draft (not yet deployed)*
