# ADR-001 — Use Next.js 15 as the Frontend Framework

**Date:** 2026-07-17
**Status:** Accepted
**Deciders:** Rizky

---

## Context

DevOS needs a frontend framework for a complex, feature-rich single-page
application that includes real-time updates, server-side data fetching,
complex routing (12+ modules), and a self-hosted deployment model.

The framework must support TypeScript natively, have a strong ecosystem,
and be relevant for job market positioning (portfolio value).

---

## Decision Drivers

- Must support TypeScript natively
- Must support both server-side and client-side rendering (hybrid)
- Must have strong ecosystem and community
- Must be deployable via Docker (self-hosted)
- Must be relevant in the current job market (portfolio value)
- Must support App Router pattern for file-based routing at scale

---

## Options Considered

### Option A — Next.js 15 (App Router)
**Pros:**
- Industry-leading React framework with massive adoption
- App Router enables React Server Components — less client-side JS
- File-based routing scales well for 12+ modules
- Built-in image optimization, font optimization, caching
- Strong job market relevance (most companies use Next.js)
- Can be self-hosted with Docker easily
- `@next/bundle-analyzer`, `next/dynamic` for code splitting out of the box

**Cons:**
- App Router has a learning curve (RSC mental model)
- Larger initial bundle than Vite-based SPAs
- Server components require careful thinking about client/server boundary

---

### Option B — Remix (React Router v7)
**Pros:**
- Excellent progressive enhancement
- Simpler data loading model (loaders/actions)
- Smaller runtime bundle

**Cons:**
- Smaller ecosystem than Next.js
- Fewer jobs use Remix
- Less mature self-hosting story
- shadcn/ui ecosystem is more Next.js-oriented

---

### Option C — Vite + React SPA
**Pros:**
- Fastest dev server, simplest mental model
- No server-side concerns — pure SPA

**Cons:**
- No SSR/SSG for any route — everything is client-rendered
- SEO irrelevant here but hydration performance worse
- No built-in image optimization
- Requires separate API server anyway

---

### Option D — SvelteKit
**Pros:**
- Excellent DX, minimal boilerplate
- Smaller runtime, faster hydration

**Cons:**
- Not TypeScript-first in ecosystem (getting better)
- Fewer DevOS-relevant libraries (shadcn/ui not available natively)
- Lower job market relevance than React/Next.js

---

## Decision

We chose **Next.js 15 with App Router** because:

1. React Server Components allow heavy modules (charts, tables, terminal)
   to be loaded lazily without client-side penalties
2. The file-based App Router scales well with 12+ top-level modules
3. shadcn/ui, TanStack Query, and Zustand are all first-class Next.js citizens
4. Self-hosting with Docker is well-documented and production-proven
5. Highest job market relevance for portfolio purposes
6. The RSC mental model investment is worth the long-term performance gains

---

## Consequences

**Positive:**
- Client/server boundary is explicit — better performance by default
- Built-in optimization (images, fonts, routes) reduces config overhead
- Strong community means solutions to problems are always findable

**Negative / Trade-offs:**
- RSC requires discipline: "use client" only when necessary
- Build times are longer than pure Vite SPA
- Caching semantics (fetch cache, revalidation) require learning

---

## References

- [Next.js App Router docs](https://nextjs.org/docs/app)
- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [Next.js self-hosting guide](https://nextjs.org/docs/app/building-your-application/deploying#self-hosting)

---

*Last updated: 2026-07-17*
