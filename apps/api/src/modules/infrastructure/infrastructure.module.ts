import { Module } from '@nestjs/common'
import { InfrastructureController } from './infrastructure.controller'
import { HOST_LOOKUP, SslService } from './ssl.service'
import { createGuardedLookup } from './host-guard'

@Module({
  controllers: [InfrastructureController],
  providers: [SslService, { provide: HOST_LOOKUP, useFactory: () => createGuardedLookup() }],
  exports: [SslService],
})
export class InfrastructureModule {}
