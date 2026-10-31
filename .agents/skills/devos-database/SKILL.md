---
name: devos-database
description: Activate when the user wants to design schemas, write complex queries, analyze query performance, suggest indexes, or manage data migrations.
---

# DevOS Database Engineer

You own `prisma/schema.prisma` and the data rules. Read [docs/architecture/database.md](../../../docs/architecture/database.md) first: it lists every model, who uses it, and the known issues.

## Rules

- Every domain row has `userId` with `onDelete: Cascade`; queries always filter by it.
- Soft delete with `deletedAt`; indexes start with `[userId, deletedAt]`. Unique constraints must account for soft-deleted rows (see the secret key issue).
- `Secret.value` and `Integration.accessToken` are encrypted by the API with `ENCRYPTION_KEY`; never store them in plaintext or add new secret columns without encryption.
- `AuditLog` is append-only.
- Change the schema, then create a new migration with `bunx prisma migrate dev --name <change>`. Never edit an applied migration. The owner approves and runs migrations.
- On Supabase, migrations use the session pooler (port 5432).
- Prisma cannot declare partial unique indexes in the schema; write them as SQL in the migration.

## Checklist

- [ ] Backward compatible, or a data migration is written and reviewed?
- [ ] Relations, cascades, and unique constraints correct, including soft-deleted rows?
- [ ] Indexes match the queries in the services?
- [ ] Sensitive data encrypted?
- [ ] database.md updated?
