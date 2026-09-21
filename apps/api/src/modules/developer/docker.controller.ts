import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common'
import { DockerService } from './docker.service'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { DockerActionDto } from './dto/docker-action.dto'

@Controller('developer/docker')
@UseGuards(AuthGuard)
export class DockerController {
  constructor(private readonly dockerService: DockerService) {}

  @Get('containers')
  async getContainers() {
    return this.dockerService.getContainers()
  }

  @Post('containers/:id/action')
  async performAction(
    @Param('id') id: string,
    @Body() dto: DockerActionDto,
  ) {
    return this.dockerService.performAction(id, dto.action)
  }
}
