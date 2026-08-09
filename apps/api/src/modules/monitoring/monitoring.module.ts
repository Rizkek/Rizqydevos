import { Module } from '@nestjs/common'
import { MonitoringController } from './monitoring.controller'
import { SslService } from './ssl.service'
import { AuditService } from '../../shared/services/audit.service'

@Module({
  controllers: [MonitoringController],
  providers: [SslService, AuditService],
  exports: [SslService],
})
export class MonitoringModule {}
