import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { Request } from 'express'

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name)

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    
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
      this.logger.debug(`Verifying session against ${authUrl}/api/auth/get-session`)
      
      const response = await fetch(`${authUrl}/api/auth/get-session`, {
        headers: {
          cookie: cookieHeader,
        },
      })

      if (!response.ok) {
        this.logger.error(`Session verification failed with status ${response.status}`)
        throw new UnauthorizedException('Invalid or expired session')
      }

      const data = (await response.json()) as { session?: any; user?: any }
      if (!data || !data.session) {
        this.logger.error('Session data missing from verification response')
        throw new UnauthorizedException('Invalid session data')
      }

      // Attach user to request
      // @ts-ignore
      request.user = data.user
      this.logger.debug(`Session verified for user: ${data.user.id}`)
      return true
    } catch (error: any) {
      this.logger.error(`AuthGuard Error: ${error.message}`, error.stack)
      throw new UnauthorizedException('Session verification failed')
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
