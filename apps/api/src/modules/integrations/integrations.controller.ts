import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { ConnectIntegrationDto, DeploymentsQueryDto, UpdateIntegrationDto } from './dto/integration.dto'
import { GithubService } from './github.service'
import { IntegrationConnectionService } from './integration-connection.service'
import { IntegrationProvider } from './integration-provider'
import { IntegrationsService } from './integrations.service'
import { VercelService } from './vercel.service'

const providerPipe = new ParseEnumPipe(IntegrationProvider)

// Connecting calls GitHub or Vercel with a user-supplied token, so it gets a tighter limit than the global one.
const CONNECT_LIMIT = { default: { limit: 10, ttl: 60_000 } }

@Controller('integrations')
@UseGuards(AuthGuard)
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly connection: IntegrationConnectionService,
    private readonly githubService: GithubService,
    private readonly vercelService: VercelService,
  ) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.integrationsService.list(userId)
  }

  @Post(':provider')
  @Throttle(CONNECT_LIMIT)
  @HttpCode(HttpStatus.OK)
  connect(
    @Param('provider', providerPipe) provider: IntegrationProvider,
    @Body() dto: ConnectIntegrationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.connection.connect(userId, provider, dto)
  }

  @Patch(':provider')
  setEnabled(
    @Param('provider', providerPipe) provider: IntegrationProvider,
    @Body() dto: UpdateIntegrationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.connection.setEnabled(userId, provider, dto.enabled)
  }

  @Delete(':provider')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnect(
    @Param('provider', providerPipe) provider: IntegrationProvider,
    @CurrentUser('id') userId: string,
  ) {
    await this.connection.disconnect(userId, provider)
  }

  @Get('github/activity')
  getGithubActivity(@CurrentUser('id') userId: string) {
    return this.githubService.getActivityFeed(userId)
  }

  @Get('github/prs')
  getGithubPRs(@CurrentUser('id') userId: string) {
    return this.githubService.getPullRequests(userId)
  }

  @Get('github/repos')
  getGithubRepos(@CurrentUser('id') userId: string) {
    return this.githubService.getRepositories(userId)
  }

  @Get('vercel/deployments')
  getVercelDeployments(@Query() query: DeploymentsQueryDto, @CurrentUser('id') userId: string) {
    return this.vercelService.getDeployments(userId, query.limit)
  }
}
