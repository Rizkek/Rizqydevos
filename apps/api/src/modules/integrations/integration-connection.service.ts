import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common'
import { AuditService } from '../../shared/services/audit.service'
import { ConnectIntegrationDto } from './dto/integration.dto'
import { GithubService } from './github.service'
import { IntegrationMetadata, IntegrationProvider, PROVIDER_LABEL } from './integration-provider'
import { IntegrationException } from './integration.errors'
import { IntegrationsService, IntegrationSummary } from './integrations.service'
import { VercelService } from './vercel.service'

// Orchestrates connect / toggle / disconnect. Lives apart from IntegrationsService because the
// provider services already depend on it for credentials, and the reverse would be a cycle.
@Injectable()
export class IntegrationConnectionService {
  constructor(
    private readonly integrations: IntegrationsService,
    private readonly github: GithubService,
    private readonly vercel: VercelService,
    private readonly audit: AuditService,
  ) {}

  async connect(userId: string, provider: IntegrationProvider, dto: ConnectIntegrationDto): Promise<IntegrationSummary> {
    if (provider === IntegrationProvider.Github && dto.teamId) {
      throw new BadRequestException('teamId is only supported for Vercel')
    }

    const metadata = await this.verify(provider, dto)
    const summary = await this.integrations.upsert(userId, provider, dto.accessToken, metadata)
    await this.audit.log(userId, 'CREATE', 'integration', summary.id, { provider, accountLogin: metadata.accountLogin })
    return summary
  }

  async setEnabled(userId: string, provider: IntegrationProvider, enabled: boolean): Promise<IntegrationSummary> {
    const summary = await this.integrations.setEnabled(userId, provider, enabled)
    await this.audit.log(userId, 'UPDATE', 'integration', summary.id, { provider, enabled })
    return summary
  }

  async disconnect(userId: string, provider: IntegrationProvider): Promise<void> {
    const removed = await this.integrations.remove(userId, provider)
    if (removed) await this.audit.log(userId, 'DELETE', 'integration', undefined, { provider })
  }

  // A token the provider refuses is a client mistake on save (422), unlike the same refusal during
  // a later data request, where it means the stored token went bad (424).
  private async verify(provider: IntegrationProvider, dto: ConnectIntegrationDto): Promise<IntegrationMetadata> {
    try {
      return provider === IntegrationProvider.Github
        ? await this.github.verifyToken(dto.accessToken)
        : await this.vercel.verifyToken(dto.accessToken, dto.teamId)
    } catch (error) {
      if (error instanceof IntegrationException && error.code === 'TOKEN_REJECTED') {
        throw new IntegrationException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'INTEGRATION_TOKEN_INVALID',
          `${PROVIDER_LABEL[provider]} did not accept this token. Check that it is valid and has the required permissions.`,
        )
      }
      throw error
    }
  }
}
