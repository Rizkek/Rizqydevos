# DevOS API

NestJS backend for DevOS.

## Development

```bash
# From repo root
bun dev --filter=@devos/api

# Or from this directory
bun dev
```

## Structure

```
src/
├── modules/         ← Feature modules (workspace, developer, ai, etc.)
├── shared/          ← Guards, filters, interceptors, decorators
├── database/        ← Prisma service and module
├── cache/           ← Redis service and module
├── config/          ← Environment variable validation
├── app.module.ts    ← Root module
└── main.ts          ← Bootstrap
prisma/
└── schema.prisma    ← Database schema
```

## Environment

Copy `.env.example` from the repo root and fill in values:

```bash
cp ../../.env.example ../../.env
```

## Database

```bash
# Generate Prisma client
bunx prisma generate

# Create migration
bunx prisma migrate dev --name init

# Open Prisma Studio
bunx prisma studio
```
