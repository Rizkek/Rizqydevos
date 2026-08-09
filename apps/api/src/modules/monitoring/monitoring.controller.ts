import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { SslService } from './ssl.service'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { AuditService } from '../../shared/services/audit.service'

@Controller('monitoring')
@UseGuards(AuthGuard)
export class MonitoringController {
  constructor(
    private readonly sslService: SslService,
    private readonly auditService: AuditService,
  ) {}

  @Get('ssl')
  async checkSsl(@Query('hostname') hostname: string, @CurrentUser('id') userId: string) {
    if (!hostname) return { error: 'hostname query param required' }
    return this.sslService.check(hostname)
  }

  @Get('ssl/batch')
  async checkSslBatch(@Query('hostnames') hostnames: string, @CurrentUser('id') userId: string) {
    if (!hostnames) return []
    const hosts = hostnames.split(',').map(h => h.trim()).filter(Boolean)
    return Promise.all(hosts.map(h => this.sslService.check(h)))
  }

  @Get('health')
  async checkHealth(@Query('url') url: string, @CurrentUser('id') userId: string) {
    if (!url) return { error: 'url query param required' }
    return this.sslService.checkHealth(url)
  }

  @Get('health/batch')
  async checkHealthBatch(@Query('urls') urls: string, @CurrentUser('id') userId: string) {
    if (!urls) return []
    const urlList = urls.split(',').map(u => u.trim()).filter(Boolean)
    return Promise.all(urlList.map(u => this.sslService.checkHealth(u)))
  }

  @Get('audit')
  async getAuditLog(@CurrentUser('id') userId: string) {
    return this.auditService.findAll(userId)
  }
}
