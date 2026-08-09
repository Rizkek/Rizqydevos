import { Module } from '@nestjs/common'
import { SecretController } from './secret.controller'
import { SecretService } from './secret.service'
import { AuditService } from '../../shared/services/audit.service'

@Module({
  controllers: [SecretController],
  providers: [SecretService, AuditService],
  exports: [AuditService],
})
export class SecretsModule {}
