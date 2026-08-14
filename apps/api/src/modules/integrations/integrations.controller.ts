import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpCode, HttpStatus, Logger, InternalServerErrorException } from '@nestjs/common'
import { IntegrationsService } from './integrations.service'
import { GithubService } from './github.service'
import { VercelService } from './vercel.service'
import { CreateIntegrationDto } from './dto/integration.dto'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'

@Controller('integrations')
@UseGuards(AuthGuard)
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name)

  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly githubService: GithubService,
    private readonly vercelService: VercelService,
  ) {}

  @Get()
  async getIntegrations(@CurrentUser('id') userId: string) {
    try {
      const list = await this.integrationsService.getUserIntegrations(userId)
      // omit sensitive tokens in response
      return list.map(i => ({ provider: i.provider, enabled: i.enabled, id: i.id }))
    } catch (error: any) {
      this.logger.error(`Failed to get integrations for user ${userId}: ${error.message}`, error.stack)
      throw new InternalServerErrorException('Failed to fetch integrations')
    }
  }

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  async configure(
    @Param('provider') provider: string,
    @Body() dto: CreateIntegrationDto,
    @CurrentUser('id') userId: string,
  ) {
    this.logger.log(`Configuring integration ${provider} for user ${userId}...`)
    try {
      dto.provider = provider
      await this.integrationsService.upsert(userId, dto)
      this.logger.log(`Successfully configured integration ${provider} for user ${userId}`)
      return { success: true }
    } catch (error: any) {
      this.logger.error(`Failed to configure integration ${provider} for user ${userId}: ${error.message}`, error.stack)
      throw new InternalServerErrorException(`Failed to configure ${provider} integration`)
    }
  }

  @Delete(':provider')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('provider') provider: string,
    @CurrentUser('id') userId: string,
  ) {
    this.logger.log(`Removing integration ${provider} for user ${userId}...`)
    try {
      await this.integrationsService.remove(userId, provider)
      this.logger.log(`Successfully removed integration ${provider} for user ${userId}`)
    } catch (error: any) {
      this.logger.error(`Failed to remove integration ${provider} for user ${userId}: ${error.message}`, error.stack)
      throw new InternalServerErrorException(`Failed to remove ${provider} integration`)
    }
  }

  @Get('github/activity')
  async getGithubActivity(@CurrentUser('id') userId: string) {
    return this.githubService.getActivityFeed(userId)
  }

  @Get('github/prs')
  async getGithubPRs(@CurrentUser('id') userId: string) {
    return this.githubService.getPullRequests(userId)
  }

  @Get('github/repos')
  async getGithubRepos(@CurrentUser('id') userId: string) {
    return this.githubService.getRepositories(userId)
  }

  @Get('vercel/deployments')
  async getVercelDeployments(@CurrentUser('id') userId: string) {
    return this.vercelService.getDeployments(userId)
  }
}
