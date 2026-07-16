# ADR-002 — Use NestJS as the Backend Framework

**Date:** 2026-07-17
**Status:** Accepted
**Deciders:** Rizky

---

## Context

DevOS needs a backend framework to serve a REST API for the Next.js
frontend, handle background jobs, WebSocket connections, and integrate
with external services (GitHub, Vercel, Docker, Cloudflare, AI providers).

The backend must be TypeScript-native, support dependency injection for
testability, and be relevant in the Indonesian and global job market.

---

## Decision Drivers

- TypeScript native — must feel consistent with the frontend
- Must support dependency injection for clean architecture
- Must handle: REST API, WebSockets, background queues, scheduled jobs
- Must be self-hostable via Docker
- Strong job market relevance for portfolio positioning
- Clean architecture must be achievable without fighting the framework

---

## Options Considered

### Option A — NestJS 11
**Pros:**
- Built for TypeScript — decorators, strong typing throughout
- Built-in DI container — clean architecture is natural
- Modular by design — matches DevOS's module structure perfectly
- Built-in support for: REST, WebSockets, queues (BullMQ), cron jobs
- Widely used in Indonesian and global companies
- Excellent testing support (@nestjs/testing)
- Strong documentation and large community

**Cons:**
- More verbose than Express/Hono for simple routes
- Decorator magic can be hard to debug initially
- Larger bundle than minimalist frameworks

---

### Option B — Go Fiber / Gin
**Pros:**
- Exceptional performance (5-10x faster than Node.js for CPU-bound work)
- Small binary, fast startup time
- Good for high-throughput services

**Cons:**
- Context switching between Go (backend) and TypeScript (frontend) adds
  cognitive overhead for a solo developer
- Weaker DI story — clean architecture requires more manual wiring
- Fewer ecosystem integrations for AI, queues, WebSockets compared to NestJS
- Lower job market relevance in frontend/fullstack roles

---

### Option C — Hono (Node.js / Bun)
**Pros:**
- Extremely fast, lightweight
- TypeScript-first, RPC client for end-to-end type safety
- Works on Edge runtimes

**Cons:**
- Very minimal — clean architecture requires building conventions from scratch
- No built-in DI, no modules — everything is manual
- Smaller ecosystem for DevOS-level complexity
- Less job market recognition than NestJS

---

### Option D — tRPC-only (Next.js API routes as backend)
**Pros:**
- No separate backend service — fewer moving parts
- End-to-end type safety out of the box
- Simpler deployment (one service)

**Cons:**
- Next.js API routes are not designed for long-running tasks or WebSockets
- BullMQ, cron jobs, and WebSocket gateways require a separate process anyway
- Mixing frontend and backend in one codebase creates tight coupling
- Hard to scale or extract individual modules later

---

## Decision

We chose **NestJS 11** because:

1. The module system in NestJS maps 1:1 to DevOS's module architecture
   (Workspace module, Developer module, AI module, etc.)
2. Built-in DI makes testing and mocking trivial — important for long-term
   maintainability
3. The framework natively supports everything DevOS needs: REST, WebSockets,
   BullMQ queues, and cron jobs — no glue code required
4. High job market relevance as a portfolio piece
5. The TypeScript-first design is consistent with the frontend code style

Go was seriously considered for performance, but the cognitive overhead of
switching languages for a solo developer — combined with NestJS's native
support for every DevOS requirement — made NestJS the clear choice.

A hybrid approach is explicitly left open: if a specific service (e.g.,
a log aggregator or a metrics collector) requires Go-level performance,
it can be added as a separate microservice without changing this decision.

---

## Consequences

**Positive:**
- Module structure mirrors product architecture — onboarding is intuitive
- DI makes unit testing every service layer straightforward
- BullMQ, WebSockets, and cron are first-class — no hacks needed

**Negative / Trade-offs:**
- More boilerplate than Hono or Express for simple endpoints
- Decorator-heavy code style requires familiarity with TypeScript decorators
- Larger runtime than Go — but irrelevant for a personal workspace with
  low concurrent user count

---

## References

- [NestJS docs](https://docs.nestjs.com/)
- [NestJS + BullMQ](https://docs.nestjs.com/techniques/queues)
- [NestJS + WebSockets](https://docs.nestjs.com/websockets/gateways)

---

*Last updated: 2026-07-17*
