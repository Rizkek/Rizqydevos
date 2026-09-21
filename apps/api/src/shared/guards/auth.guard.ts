import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

interface AuthenticatedUser {
  id: string
}

interface SessionResponse {
  session?: { id?: string }
  user?: AuthenticatedUser
}

type AuthenticatedRequest = Request & { user?: AuthenticatedUser }

const SESSION_TIMEOUT_MS = 5_000

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name)

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    if (request.user) return true

    const cookieHeader = request.headers.cookie
    if (!cookieHeader) {
      this.logger.warn(`[${request.method} ${request.url}] Authentication cookie missing`)
      throw new UnauthorizedException('Authentication cookie missing')
    }

    try {
      // Forward the cookie to the frontend's better-auth endpoint to verify the session
      const authUrl = process.env.BETTER_AUTH_URL
      if (!authUrl) {
        throw new Error('BETTER_AUTH_URL is not configured')
      }
      this.logger.debug('Verifying API session')

      const response = await fetch(`${authUrl}/api/auth/get-session`, {
        headers: {
          cookie: cookieHeader,
        },
        signal: AbortSignal.timeout(SESSION_TIMEOUT_MS),
      })

      if (!response.ok) {
        throw new UnauthorizedException('Invalid or expired session')
      }

      const data = (await response.json()) as SessionResponse
      if (!data.session?.id || !data.user?.id) {
        this.logger.error('Session data missing from verification response')
        throw new UnauthorizedException('Invalid session data')
      }

      request.user = data.user
      return true
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) throw error

      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Session verification failed: ${message}`)
      throw new UnauthorizedException('Session verification failed')
    }
  }
}
