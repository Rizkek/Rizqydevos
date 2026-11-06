# ADR-006 — Deploy the web app on Vercel and the API on Render, proxied through Next.js

**Date:** 2026-11-01
**Status:** Accepted
**Deciders:** Rizky
**Supersedes:** ADR-005 (Docker + Coolify)

---

## Context

DevOS must run at zero cost for one user. The web app (Next.js with Better Auth) and the API (NestJS, a long-running server) are separate processes. Better Auth sets the session cookie on the web app's domain, and the API verifies every request by forwarding that cookie to the web app. Free hosts give each service its own domain under a public suffix (`vercel.app`, `onrender.com`), so a browser does not send the web app's cookie to the API.

## Options considered

| Option | Cost | Trade-off |
|---|---|---|
| Web on Vercel, API on Render Free, Next.js rewrites `/api/v1/*` to the API | Free | The API sleeps when idle; the first request after a pause waits for it to wake |
| Web and API both on Render Free | Free | Both sleep; two services may exceed the free monthly hours |
| VPS with Coolify (ADR-005) | Needs a VPS | No sleeping, but a server to maintain; no VPS is available |
| Custom domain with `app.` and `api.` subdomains and cross-subdomain cookies | Domain cost after the first year | Removes the proxy; no domain is available now |
| Run NestJS as Vercel functions | Free | Function time limits, in-memory rate limits per instance; larger change |

## Decision

Web on Vercel, API on Render Free. The browser calls `/api/v1/*` on the web app's own origin, and `next.config.ts` rewrites those requests to `API_URL`. The session cookie therefore always travels with API calls, and CORS is no longer on the request path.

## Consequences

- One origin for the browser; no cookie or CORS configuration across domains.
- `src/proxy.ts` skips `/api/v1`, so expired sessions come back from the API as JSON 401, not as a redirect page.
- Cold starts: the proxy answers 502 or 504 while the API wakes. `fetchApi` maps that to `API_UNAVAILABLE` and queries retry with backoff.
- Every API request passes through Vercel, adding one network hop. Client IPs seen by the API come from the proxy chain; rate limiting depends on `TRUST_PROXY_HOPS`.
- Migrations are run by the owner (`bunx prisma migrate deploy`); Render Free has no pre-deploy hook used here.
- Moving later to a custom domain or another host only changes `API_URL` and the host configuration, not the application code.

## References

- [docs/deployment.md](../../deployment.md)
- `render.yaml`, `apps/web/vercel.json`, `apps/web/next.config.ts`

---

*Last updated: 2026-11-01*
