import { Module } from '@nestjs/common'
import { InfrastructureController } from './infrastructure.controller'
import { SslService } from './ssl.service'

@Module({
  controllers: [InfrastructureController],
  providers: [SslService],
  exports: [SslService],
})
export class InfrastructureModule {}
