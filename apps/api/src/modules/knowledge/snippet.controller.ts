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
  UseGuards,
} from '@nestjs/common'
import { SnippetService } from './snippet.service'
import { CreateSnippetDto } from './dto/create-snippet.dto'
import { UpdateSnippetDto } from './dto/update-snippet.dto'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'

@Controller('knowledge/snippets')
@UseGuards(AuthGuard)
export class SnippetController {
  constructor(private readonly snippetService: SnippetService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('language') language?: string,
    @Query('pinned') pinned?: string,
  ) {
    return this.snippetService.findAll(userId, {
      ...(language !== undefined && { language }),
      ...(pinned !== undefined && { pinned: pinned === 'true' }),
    })
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.snippetService.findOne(id, userId)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSnippetDto, @CurrentUser('id') userId: string) {
    return this.snippetService.create(userId, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSnippetDto, @CurrentUser('id') userId: string) {
    return this.snippetService.update(id, userId, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.snippetService.remove(id, userId)
  }
}
