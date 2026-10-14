import { Module } from '@nestjs/common'
import { AuditService } from '../../shared/services/audit.service'
import { IntegrationConnectionService } from './integration-connection.service'
import { IntegrationsController } from './integrations.controller'
import { IntegrationsService } from './integrations.service'
import { GithubService } from './github.service'
import { VercelService } from './vercel.service'

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService, IntegrationConnectionService, GithubService, VercelService, AuditService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
