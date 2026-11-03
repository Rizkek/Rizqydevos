import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { AuthenticatedSession } from '../guards/auth.guard'

// The Better Auth session that AuthGuard verified for this request, or null on public routes.
export const CurrentSession = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedSession | null => {
  const request = ctx.switchToHttp().getRequest<{ session?: AuthenticatedSession }>()
  return request.session ?? null
})
