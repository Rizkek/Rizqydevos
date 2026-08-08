import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ProjectsService } from './projects.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { ProjectStatus } from '@prisma/client'

const DEV_USER_ID = 'dev-user-placeholder'

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@Query('status') status?: ProjectStatus) {
    return this.projectsService.findAll(DEV_USER_ID, { status })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id, DEV_USER_ID)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(DEV_USER_ID, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, DEV_USER_ID, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.projectsService.remove(id, DEV_USER_ID)
  }
}
