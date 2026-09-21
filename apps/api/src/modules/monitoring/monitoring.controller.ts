import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common'
import { SslService } from './ssl.service'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { AuditService } from '../../shared/services/audit.service'
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto'

// Max 20 hosts per batch to prevent resource exhaustion
const MAX_BATCH = 20
// Deny private-network targets (loopback, link-local, RFC 1918, ::1, metadata)
const PRIVATE_HOSTNAME_RE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0|\[?::1\]?|\[?fc|\[?fd)/i

function validateHostname(hostname: string): void {
  if (!hostname || hostname.length > 253) throw new BadRequestException('Invalid hostname')
  if (PRIVATE_HOSTNAME_RE.test(hostname)) throw new BadRequestException('Private network targets are not permitted')
}

function validateUrl(rawUrl: string): void {
  let parsed: URL
  try { parsed = new URL(rawUrl) } catch { throw new BadRequestException('Invalid URL') }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new BadRequestException('Only http/https URLs are permitted')
  validateHostname(parsed.hostname)
}

@Controller('monitoring')
@UseGuards(AuthGuard)
export class MonitoringController {
  constructor(
    private readonly sslService: SslService,
    private readonly auditService: AuditService,
  ) {}

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

  @Get('audit')
  async getAuditLog(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.auditService.findAll(userId, pagination)
  }
}
