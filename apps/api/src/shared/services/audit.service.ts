import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { Prisma } from '@prisma/client'

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'REVEAL_SECRET' | 'LOGIN' | 'LOGOUT'

import { PaginationQueryDto } from '../dto/pagination-query.dto'

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name)

  constructor(private readonly prisma: PrismaService) {}

  async log(
    userId: string,
    action: AuditAction,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId: resourceId ?? null,
          metadata: (metadata ?? {}) as Prisma.InputJsonValue,
        },
      })
    } catch (err) {
      // Audit log failures must never break the main operation
      this.logger.error(`Failed to write audit log: ${action} on ${resource}`, err)
    }
  }

  async findAll(userId: string, query?: PaginationQueryDto) {
    const limit = query?.limit ?? 50
    const page = query?.page ?? 1
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })
  }
}
