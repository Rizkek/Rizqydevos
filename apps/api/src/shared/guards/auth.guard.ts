import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { Request } from 'express'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    
    // Better Auth uses this cookie name by default, or an Authorization header
    const token = 
      request.cookies?.['better-auth.session_token'] ||
      this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException('Authentication token missing')
    }

    // Lookup session in DB
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session')
    }

    if (session.expiresAt < new Date()) {
      // Better auth handles cleanup, but we should reject expired sessions
      throw new UnauthorizedException('Session expired')
    }

    // Attach user to request
    // @ts-ignore - we dynamically add user to Request
    request.user = session.user

    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
