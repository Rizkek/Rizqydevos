import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { Public } from './shared/decorators/public.decorator'
import { PrismaService } from './database/prisma.service'
import { CacheService } from './cache/cache.service'

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  @Get('liveness')
  @Public()
  liveness() {
    return { status: 'ok' }
  }

  @Get('readiness')
  @Public()
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      await this.cache.get('health-check')
      return { status: 'ready', database: 'ok', cache: 'ok' }
    } catch (error) {
      throw new ServiceUnavailableException('Service is not ready')
    }
  }

  @Get()
  @Public()
  check() {
    return this.liveness()
  }
}