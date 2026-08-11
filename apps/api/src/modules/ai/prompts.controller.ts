import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { PromptsService } from './prompts.service'
import { CreatePromptDto } from './dto/create-prompt.dto'
import { UpdatePromptDto } from './dto/update-prompt.dto'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'

@Controller('ai/prompts')
@UseGuards(AuthGuard)
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.promptsService.findAll(userId)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.promptsService.findOne(id, userId)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePromptDto, @CurrentUser('id') userId: string) {
    return this.promptsService.create(userId, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromptDto, @CurrentUser('id') userId: string) {
    return this.promptsService.update(id, userId, dto)
  }

  @Post(':id/usage')
  @HttpCode(HttpStatus.OK)
  incrementUsage(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.promptsService.incrementUsage(id, userId)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.promptsService.remove(id, userId)
  }
}
