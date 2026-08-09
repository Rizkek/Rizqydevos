import { Module } from '@nestjs/common'
import { IntegrationsController } from './integrations.controller'
import { IntegrationsService } from './integrations.service'
import { GithubService } from './github.service'
import { VercelService } from './vercel.service'

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService, GithubService, VercelService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
