import { Module } from '@nestjs/common'
import { DockerController } from './docker.controller'
import { DockerService } from './docker.service'
import { TerminalGateway } from './terminal.gateway'
import { TerminalService } from './terminal.service'

@Module({
  controllers: [DockerController],
  providers: [DockerService, TerminalGateway, TerminalService],
  exports: [DockerService, TerminalService],
})
export class DeveloperModule {}
