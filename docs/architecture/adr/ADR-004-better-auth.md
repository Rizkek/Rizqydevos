# ADR-004 — Use Better Auth for Authentication

**Date:** 2026-07-17
**Status:** Accepted
**Deciders:** Rizky

---

## Context

DevOS is a personal application — there is effectively one user (Rizky).
But the auth system must be robust: it needs to support passkey (WebAuthn)
as the primary login method, OAuth as a fallback, protect all routes, and
manage sessions securely.

The auth library must be TypeScript-native, work with NestJS on the backend
and Next.js on the frontend, and support modern auth patterns (passkeys,
OAuth, session cookies — not just JWT).

---

## Decision Drivers

- Must support Passkey / WebAuthn as primary login
- Must support GitHub OAuth (and Google OAuth)
- Must be TypeScript-native
- Must work with Next.js (frontend) and NestJS (backend) together
- Must store sessions in the database (not stateless JWT-only)
- Must handle session rotation and refresh token security
- Must be self-hostable — no auth-as-a-service dependency

---

## Options Considered

### Option A — Better Auth
**Pros:**
- Purpose-built for modern TypeScript stacks (Next.js, Nuxt, etc.)
- First-class Passkey (WebAuthn) support out of the box
- Supports GitHub, Google, and custom OAuth providers
- Database sessions (not stateless JWT) — can revoke sessions
- Framework-agnostic core — works with Next.js + NestJS setup
- Actively maintained, growing community
- Self-hosted — no external auth service dependency

**Cons:**
- Newer library — less battle-tested than Auth.js
- Smaller community than Auth.js / Clerk
- Less documentation for complex NestJS integrations

---

### Option B — Auth.js (NextAuth v5)
**Pros:**
- Very widely used, extensive documentation
- Works with Next.js natively
- OAuth providers well-supported
- Good Prisma adapter

**Cons:**
- Passkey support is experimental and not first-class
- Primarily designed for Next.js — NestJS integration is awkward
- Session management is less flexible than Better Auth
- API is changing between v4 and v5 — migration headaches

---

### Option C — Clerk
**Pros:**
- Best-in-class UX out of the box
- Passkey, MFA, SSO all supported
- Excellent Next.js SDK

**Cons:**
- **SaaS dependency** — violates P7 (Privacy by Default)
- User data and auth managed by a third party
- Costs money at scale
- If Clerk goes down, DevOS auth goes down

---

### Option D — Custom Implementation (Passport.js)
**Pros:**
- Full control
- Flexible

**Cons:**
- Auth is hard to get right — security-critical code should not be DIY
- Passkey implementation from scratch is complex
- High maintenance burden

---

## Decision

We chose **Better Auth** because:

1. Passkey support is a first-class feature — this aligns with the goal of
   using modern, passwordless auth that is more secure than passwords
2. Self-hosted — user session data never leaves our own database, aligning
   with P7 (Privacy by Default)
3. TypeScript-native design works well with the existing stack
4. Database sessions allow explicit session revocation (important for a
   personal dashboard that might be accessed from multiple devices)

Clerk was explicitly rejected because of the third-party dependency —
a self-hosted personal operating system should not have its authentication
controlled by an external SaaS.

---

## Consequences

**Positive:**
- Passkey login — no password to remember or leak
- Full session control — can see and revoke all active sessions
- Auth data stays on our database

**Negative / Trade-offs:**
- Better Auth is newer — may hit rough edges not yet documented
- NestJS integration requires custom middleware (not a standard plugin)
- Must implement our own rate limiting on auth endpoints (Better Auth
  does not include this by default)

---

## Session Architecture

```
Login (Passkey or OAuth)
  │
  ▼
Better Auth creates Session in PostgreSQL
  │
  ├── httpOnly cookie set (sameSite: lax, secure: true in prod)
  ├── Session TTL: 30 days (sliding expiry)
  └── Active sessions visible in Settings > Security

Logout
  │
  ▼
Session deleted from database + cookie cleared
```

---

## References

- [Better Auth docs](https://www.better-auth.com/)
- [WebAuthn spec](https://www.w3.org/TR/webauthn-3/)
- [Better Auth + Prisma](https://www.better-auth.com/docs/adapters/prisma)

---

*Last updated: 2026-07-17*
