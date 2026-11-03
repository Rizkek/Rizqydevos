import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common'
import { SslService } from './ssl.service'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { MAX_BATCH, validateHostname, validateUrl } from './target-validation'

// Uptime and SSL checks for the owner's own sites (formerly the Monitoring module).
@Controller('infrastructure')
@UseGuards(AuthGuard)
export class InfrastructureController {
  constructor(private readonly sslService: SslService) {}

  @Get('ssl')
  async checkSsl(@Query('hostname') hostname: string, @CurrentUser('id') _userId: string) {
    if (!hostname) throw new BadRequestException('hostname query param required')
    validateHostname(hostname)
    return this.sslService.check(hostname)
  }

  @Get('ssl/batch')
  async checkSslBatch(@Query('hostnames') hostnames: string, @CurrentUser('id') _userId: string) {
    if (!hostnames) return []
    const hosts = hostnames.split(',').map(h => h.trim()).filter(Boolean).slice(0, MAX_BATCH)
    hosts.forEach(validateHostname)
    return Promise.all(hosts.map(h => this.sslService.check(h)))
  }

  @Get('health')
  async checkHealth(@Query('url') url: string, @CurrentUser('id') _userId: string) {
    if (!url) throw new BadRequestException('url query param required')
    validateUrl(url)
    return this.sslService.checkHealth(url)
  }

  @Get('health/batch')
  async checkHealthBatch(@Query('urls') urls: string, @CurrentUser('id') _userId: string) {
    if (!urls) return []
    const urlList = urls.split(',').map(u => u.trim()).filter(Boolean).slice(0, MAX_BATCH)
    urlList.forEach(validateUrl)
    return Promise.all(urlList.map(u => this.sslService.checkHealth(u)))
  }
}
