import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { ChecklistService } from './checklist.service'
import { AddChecklistTemplatesDto, CreateChecklistItemDto, UpdateChecklistItemDto } from './dto/checklist.dto'

@Controller('checklist')
@UseGuards(AuthGuard)
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.checklistService.findAll(userId)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateChecklistItemDto, @CurrentUser('id') userId: string) {
    return this.checklistService.create(userId, dto)
  }

  // Declared before :id routes so "templates" is not read as an id.
  @Post('templates')
  @HttpCode(HttpStatus.OK)
  addTemplates(@Body() dto: AddChecklistTemplatesDto, @CurrentUser('id') userId: string) {
    return this.checklistService.addTemplates(userId, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChecklistItemDto, @CurrentUser('id') userId: string) {
    return this.checklistService.update(id, userId, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.checklistService.remove(id, userId)
  }
}
