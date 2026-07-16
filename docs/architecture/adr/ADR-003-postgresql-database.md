# ADR-003 — Use PostgreSQL as the Primary Database

**Date:** 2026-07-17
**Status:** Accepted
**Deciders:** Rizky

---

## Context

DevOS stores: user settings, tasks, notes, snippets, bookmarks, project data,
audit logs, secrets (encrypted), AI conversations, and integration tokens.
The data is relational by nature — users own resources, resources belong
to modules, audit logs reference every other entity.

We need a database that is reliable, supports complex queries, handles
JSON when needed, and is self-hostable.

---

## Decision Drivers

- Relational data with complex relationships (User → many resources)
- Must support JSONB for flexible widget config and metadata
- Must support full-text search (at minimum for notes and snippets)
- Must be self-hostable on a VPS with Docker
- Must work well with Prisma ORM
- Long track record — no experiments in the data layer

---

## Options Considered

### Option A — PostgreSQL 17
**Pros:**
- Most battle-tested open-source relational database
- Native JSONB for flexible schema where needed
- Full-text search built-in (pg_tsvector)
- Row-level security for future multi-tenancy
- Excellent Prisma support (first-class)
- Supabase uses PostgreSQL — if a managed option is needed, it's available
- Extensions: pgcrypto, uuid-ossp, pg_stat_statements

**Cons:**
- More complex to operate than SQLite for a solo developer
- Requires a separate process (Docker container)

---

### Option B — SQLite (via Turso or local)
**Pros:**
- Zero operational overhead — single file
- Turso offers edge replication
- Fastest for single-user workloads
- Prisma supports SQLite

**Cons:**
- No JSONB (JSON stored as text)
- Limited full-text search capabilities
- No row-level security
- Concurrent writes can be problematic
- Migration from SQLite to PostgreSQL later is painful

---

### Option C — MySQL / MariaDB
**Pros:**
- Very widely used, familiar
- Good Prisma support

**Cons:**
- Inferior JSONB support vs PostgreSQL
- Less powerful query planner
- No row-level security
- PostgreSQL is strictly better for this use case

---

### Option D — MongoDB
**Pros:**
- Flexible schema for varied data shapes
- Easy horizontal scaling

**Cons:**
- DevOS data is relational — flexible schema is a weakness, not a strength
- Prisma support for MongoDB is second-class
- ACID transactions are more complex
- Not a good choice when Prisma is the ORM

---

## Decision

We chose **PostgreSQL 17** because:

1. DevOS data is inherently relational — all resources are owned by a user,
   and foreign key constraints prevent orphaned data
2. JSONB handles the flexible cases (widget config, integration metadata)
   without needing a separate document store
3. Prisma's PostgreSQL support is first-class — migrations, type generation,
   and query building are all excellent
4. The operational complexity of running PostgreSQL in Docker is low and
   well-documented
5. SQLite was tempting for simplicity, but migrating away from SQLite when
   the data grows or when multi-device access is needed is unnecessarily painful

---

## Consequences

**Positive:**
- ACID compliance — no partial writes, no data corruption on crash
- JSONB for widget config means no schema migration for widget settings changes
- Full-text search available without adding Meilisearch for simple cases

**Negative / Trade-offs:**
- Must run PostgreSQL as a Docker container (adds operational complexity)
- Connection pooling required (PgBouncer or Prisma Accelerate for production)
- Backups must be explicitly configured (pg_dump on schedule)

---

## References

- [Prisma PostgreSQL guide](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [PostgreSQL JSONB docs](https://www.postgresql.org/docs/current/datatype-json.html)

---

*Last updated: 2026-07-17*
