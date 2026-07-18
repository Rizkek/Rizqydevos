---
name: devos-backend
description: Activate when working on DevOS backend code — NestJS controllers, services, Prisma interactions, authentication, or any API implementation in the Rizqydevos project.
---

# DevOS Backend Engineering Guidelines

When working on the DevOS backend (NestJS inside `apps/api`), you must strictly adhere to the following enterprise-grade conventions. The goal is to maintain a highly scalable, predictable, and strictly typed Monorepo backend.

## 1. Monorepo Architecture & Paths
- **Backend Root:** All NestJS code lives inside `apps/api`.
- **Shared Types:** All shared TypeScript interfaces, enums, and types must reside in `packages/types/src`. When you create a new data structure that the frontend will need, you MUST create it in `packages/types` first, export it in `packages/types/src/index.ts`, and then import it in NestJS via `@devos/types`.
- **Imports:** Always use absolute imports configured in `tsconfig.json` (e.g., `import { PrismaService } from 'src/database/prisma.service'`).

## 2. Directory Structure & Naming Conventions
Each feature/domain must have its own isolated folder inside `apps/api/src/modules/` (e.g., `src/modules/projects/`). A standard module contains:
- `projects.module.ts`: The module definition (imports, controllers, providers).
- `projects.controller.ts`: Handles HTTP routing, input validation (DTOs), and standard responses.
- `projects.service.ts`: Contains pure business logic and database calls.
- `dto/create-project.dto.ts`: Data Transfer Objects for validation.
- `entities/project.entity.ts` (Optional): Serialization rules for outgoing data.

**Naming:** Use kebab-case for files (`user-profile.controller.ts`) and PascalCase for classes (`UserProfileController`).

## 3. Data Validation & DTOs
- **ValidationPipe:** NestJS is configured with a global `ValidationPipe` (`whitelist: true`, `transform: true`).
- **DTO Construction:** You MUST use `class-validator` (e.g., `@IsString()`, `@IsOptional()`, `@IsUUID()`) and `class-transformer` (e.g., `@Type(() => Number)`) on all incoming request bodies and queries.
- **Strictness:** Never use `any` in DTOs. If a shape is dynamic, use `Record<string, unknown>` and validate it via custom decorators or Zod.

```typescript
// Example DTO
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { CreateProjectInput } from '@devos/types'; // Import from shared types!

export class CreateProjectDto implements CreateProjectInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
```

## 4. Prisma 7 & Database Access
- **PrismaService:** All DB calls must go through the injected `PrismaService` from `src/database/prisma.service.ts`. Never instantiate a new `PrismaClient` locally.
- **Error Handling:** DO NOT wrap Prisma calls in `try/catch` blocks just to throw a generic `HttpException`. Let Prisma throw its native `PrismaClientKnownRequestError` (e.g., P2002 for unique constraint violations). The `GlobalExceptionFilter` (`src/shared/filters/global-exception.filter.ts`) is designed to catch these and format them securely for the client.
- **Transactions:** For multi-step database mutations, use Prisma Interactive Transactions (`this.prisma.$transaction(async (tx) => { ... })`).

## 5. Controllers (The Presentation Layer)
- Controllers should be extremely thin. Their only jobs are:
  1. Extracting parameters/body (`@Param`, `@Body`, `@Query`).
  2. Passing data to the Service.
  3. Returning the Service's result.
- **Standardized Response:** Ensure the response matches the standard REST format expected by the frontend.
- **No Business Logic:** Do not write `if/else` business rules in controllers.

```typescript
// Example Controller
@Controller('projects')
@UseGuards(AuthGuard) // Assuming a guard exists
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }
}
```

## 6. Services (The Business Logic Layer)
- Inject dependencies cleanly via the constructor.
- Return raw data or throw specific NestJS HTTP Exceptions (e.g., `NotFoundException`, `ForbiddenException`) if business rules are violated.
- Keep methods focused (Single Responsibility Principle).

## 7. Authentication (Better Auth)
- DevOS uses Better Auth. Since Better Auth handles its own route (`/api/auth/[...all]`) on both Next.js and NestJS, backend endpoints that require protection must verify the session.
- When building Auth Guards, extract the session token from the `Authorization` header or cookies and verify it against Better Auth's server client.
- Always attach the resolved `user` object to the NestJS `request` object so controllers can access it via a custom `@CurrentUser()` decorator.

## 8. Security & Performance
- **Throttling:** Do not bypass `@nestjs/throttler`. If an endpoint is heavy (e.g., file upload, AI processing), configure custom throttle limits for that specific route.
- **Environment Variables:** All env vars must be validated. Use `@nestjs/config` with Zod or Joi validation before app bootstrap.

## 9. Logging
- Use NestJS's built-in `Logger` (or Pino if configured).
- Avoid `console.log`. Use `this.logger.debug()`, `this.logger.log()`, or `this.logger.error()`.
- Log incoming requests and errors clearly without exposing sensitive PII or secrets.
