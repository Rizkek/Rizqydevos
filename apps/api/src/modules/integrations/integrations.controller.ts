import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common'
import { IntegrationsService } from './integrations.service'
import { GithubService } from './github.service'
import { VercelService } from './vercel.service'
import { CreateIntegrationDto } from './dto/integration.dto'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'

@Controller('integrations')
@UseGuards(AuthGuard)
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly githubService: GithubService,
    private readonly vercelService: VercelService,
  ) {}

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  async configure(
    @Param('provider') provider: string,
    @Body() dto: CreateIntegrationDto,
    @CurrentUser('id') userId: string,
  ) {
    dto.provider = provider
    await this.integrationsService.upsert(userId, dto)
    return { success: true }
  }

  @Delete(':provider')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('provider') provider: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.integrationsService.remove(userId, provider)
  }

  @Get('github/activity')
  async getGithubActivity(@CurrentUser('id') userId: string) {
    return this.githubService.getActivityFeed(userId)
  }

  @Get('github/prs')
  async getGithubPRs(@CurrentUser('id') userId: string) {
    return this.githubService.getPullRequests(userId)
  }

  @Get('vercel/deployments')
  async getVercelDeployments(@CurrentUser('id') userId: string) {
    return this.vercelService.getDeployments(userId)
  }
}
