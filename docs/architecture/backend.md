# Backend Architecture

This document defines the complete backend architecture for DevOS.
Every structural decision recorded here is the source of truth for
all backend development.

Reference: [Principles](../vision/03-principles.md) | [Frontend Architecture](./frontend.md) | [Engineering Standards](../engineering/standards.md)

---

## Technology Stack

| Concern | Technology | Reason |
|---------|-----------|--------|
| Runtime | Node.js 22 (LTS) | Stable, performant, ecosystem |
| Framework | NestJS 11 | Modular, enterprise-grade, DI built-in |
| Language | TypeScript (strict mode) | Consistent with frontend |
| ORM | Prisma 6 | Type-safe queries, great DX, migration tooling |
| Database | PostgreSQL 17 | Reliable, feature-rich, excellent JSON support |
| Cache | Redis 7 | Session, caching, rate limiting |
| Auth | Better Auth | Modern auth library, passkey + OAuth support |
| Validation | class-validator + class-transformer | NestJS-native validation |
| API Style | REST | REST for simplicity |
| File Storage | S3-compatible (Cloudflare R2) | Cheap, no egress, edge-distributed |

---

## Architecture Pattern

DevOS backend follows **Modular Clean Architecture** within NestJS.

```
Request
  │
  ▼
Guard (Auth + RBAC)
  │
  ▼
Controller (route handling only)
  │
  ▼
Service (business logic & data access)
  │
  ▼
Prisma ORM
  │
  ▼
PostgreSQL
```

Each layer has a strict responsibility:

| Layer | Responsibility | Must NOT |
|-------|---------------|---------|
| **Controller** | Parse request, call service, return response | Contain business logic |
| **Service** | Business logic, orchestration, Prisma queries | Parse HTTP requests directly |
| **DTO** | Input validation and transformation | Contain logic |
| **Entity** | Database model mapping | Be exposed directly to API |

---

## Folder Structure

```
src/
│
├── modules/                      ← Feature modules (one per domain)
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   │
│   ├── workspace/
│   │   ├── workspace.module.ts
│   │   ├── todo/
│   │   │   ├── todo.controller.ts
│   │   │   ├── todo.service.ts
│   │   │   └── dto/
│   │   ├── notes/
│   │   ├── kanban/
│   │   └── bookmarks/
│   │
│   ├── developer/
│   │   ├── github/
│   │   ├── docker/
│   │   ├── snippets/
│   │   └── ssh/
│   │
│   ├── knowledge/
│   ├── infrastructure/
│   ├── security/
│   ├── monitoring/
│   ├── ai/
│   └── automation/
│
├── shared/                       ← Shared utilities across modules
│   ├── decorators/               ← Custom NestJS decorators
│   │   ├── current-user.decorator.ts
│   │   └── public.decorator.ts
│   ├── filters/                  ← Exception filters
│   │   ├── http-exception.filter.ts
│   │   └── prisma-exception.filter.ts
│   ├── guards/                   ← Global guards
│   │   └── auth.guard.ts
│   ├── interceptors/             ← Request/response interceptors
│   │   ├── logging.interceptor.ts
│   │   ├── response-transform.interceptor.ts
│   │   └── cache.interceptor.ts
│   ├── middleware/               ← Middleware components
│   │   └── correlation-id.middleware.ts
│   ├── logger/                   ← Custom logging setup
│   │   └── pino-logger.service.ts
│   ├── pipes/                    ← Validation pipes
│   │   └── validation.pipe.ts
│   └── types/                    ← Shared TypeScript types
│       ├── auth.types.ts
│       └── common.types.ts
│
├── database/                     ← Database configuration
│   ├── prisma.service.ts         ← Prisma client as NestJS service
│   └── database.module.ts
│
├── cache/                        ← Redis configuration
│   ├── cache.service.ts
│   └── cache.module.ts
│
├── config/                       ← App configuration
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── redis.config.ts
│   └── env.validation.ts         ← Zod env validation at startup
│
├── app.module.ts                 ← Root module
└── main.ts                       ← Bootstrap, global pipes/filters
```

---

## API Design

### Base URL Structure

```
/api/v1/[module]/[resource]

Examples:
GET    /api/v1/workspace/todos
POST   /api/v1/workspace/todos
GET    /api/v1/workspace/todos/:id
PATCH  /api/v1/workspace/todos/:id
DELETE /api/v1/workspace/todos/:id

GET    /api/v1/developer/github/activity
GET    /api/v1/infrastructure/servers
POST   /api/v1/ai/chat
```

### Standard Response Envelope

All API responses follow this shape:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {               // optional, for paginated responses
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": { ... }    // optional field-level errors
  }
}
```

### Pagination Convention

All list endpoints support:

```
GET /api/v1/workspace/todos?page=1&limit=20&sort=createdAt&order=desc
```

---

## DTO Convention

```typescript
// workspace/todo/dto/create-todo.dto.ts
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateTodoDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high'

  @IsOptional()
  @IsDateString()
  dueDate?: string
}
```

**Rules:**
- DTOs are immutable — never mutate after validation
- DTOs never leak to the database — always map to entity
- All string inputs trimmed via `@Transform`
- Optional fields always explicitly `@IsOptional()`

---

## Service Layer Convention

```typescript
// workspace/todo/todo.service.ts
@Injectable()
export class TodoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(userId: string, query: PaginationQueryDto) {
    const cacheKey = `todos:${userId}:${JSON.stringify(query)}`
    const cached = await this.cacheService.get<any>(cacheKey)
    if (cached) return cached

    const result = await this.prisma.todo.findMany({
      where: { userId, deletedAt: null },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    })
    
    await this.cacheService.set(cacheKey, result, 60) // 60s TTL
    return result
  }

  async create(userId: string, dto: CreateTodoDto) {
    const todo = await this.prisma.todo.create({
      data: { ...dto, userId },
    })
    await this.cacheService.invalidatePattern(`todos:${userId}:*`)
    return todo
  }
}
```

---

## Authentication Architecture

### Strategy

```
Browser
  │
  ├── Passkey (WebAuthn)    ← Primary / preferred
  ├── GitHub OAuth          ← Quick login
  └── Google OAuth          ← Alternative
         │
         ▼
     Better Auth
         │
         ├── Session stored in database (PostgreSQL)
         ├── Session cookie (httpOnly, secure, sameSite: lax)
         └── JWT for API-only clients (short expiry: 15min)
                 │
                 └── Refresh token (rotating, stored in DB)
```

### Guards

```typescript
// All routes protected by default
// Public routes decorated with @Public()

@Controller('workspace/todos')
export class TodoController {
  @Get()
  // protected by default — requires valid session
  findAll(@CurrentUser() user: User) { ... }

  @Get('public-preview')
  @Public()  // explicitly opt-out of auth
  getPublicPreview() { ... }
}
```

---

## Caching Strategy

| Data Type | TTL | Invalidation |
|-----------|-----|-------------|
| GitHub activity | 5 min | On manual refresh |
| Docker container status | 30 sec | Real-time WebSocket |
| User todos | 60 sec | On mutation |
| Infrastructure health | 15 sec | Scheduled refresh |
| Snippets list | 5 min | On mutation |
| AI model list | 1 hour | Manual |

Cache keys follow the pattern: `[module]:[userId]:[resource]:[params]`
 
 ---
 
 ## Database Design Principles

1. **Every table has**: `id` (cuid2), `createdAt`, `updatedAt`
2. **Soft deletes**: sensitive data uses `deletedAt` nullable timestamp
3. **No raw SQL**: all queries through Prisma
4. **Transactions**: any operation touching 2+ tables uses `$transaction`
5. **Indexes**: every foreign key column is indexed
6. **Migrations**: every schema change has a named migration file

```prisma
// prisma/schema.prisma
model Todo {
  id          String    @id @default(cuid())
  title       String
  description String?
  priority    Priority  @default(MEDIUM)
  completed   Boolean   @default(false)
  dueDate     DateTime?
  deletedAt   DateTime? // soft delete

  userId      String
  user        User      @relation(fields: [userId], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@index([userId, completed])
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
```

---

## Security Requirements

- **All endpoints** protected by `AuthGuard` by default — opt-out with `@Public()`
- **Rate limiting**: 100 req/min per user (configurable per endpoint)
- **Input validation**: every endpoint with a body uses a DTO
- **CORS**: explicit allowlist — no wildcard in production
- **Helmet**: all security headers set via `@nestjs/helmet`
- **Environment variables**: validated at startup via Zod schema
- **Secrets**: never logged, never returned in API responses
- **Audit log**: every write operation creates an audit record

---

## Error Handling

```typescript
// shared/filters/http-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Prisma errors → mapped to HTTP errors
    // Validation errors → 400 with field details
    // Auth errors → 401
    // Not found → 404
    // All others → 500 with sanitized message (no stack in production)
  }
}
```

All errors return the standard error envelope. Stack traces are **never**
returned in production responses.

---

## Environment Variables

All env vars validated at startup. App refuses to start if any are missing.

```typescript
// config/env.validation.ts
const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3001),
  APP_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),

  // Storage
  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET_NAME: z.string(),

  // AI
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>
export const env = envSchema.parse(process.env)
```

---

*Last updated: 2026-07-17*
*Status: Foundation*
