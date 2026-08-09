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
import { SnippetService } from './snippet.service'
import { CreateSnippetDto } from './dto/create-snippet.dto'
import { UpdateSnippetDto } from './dto/update-snippet.dto'

const DEV_USER_ID = 'dev-user-placeholder'

@Controller('knowledge/snippets')
export class SnippetController {
  constructor(private readonly snippetService: SnippetService) {}

  @Get()
  findAll(
    @Query('language') language?: string,
    @Query('pinned') pinned?: string,
  ) {
    return this.snippetService.findAll(DEV_USER_ID, {
      ...(language !== undefined && { language }),
      ...(pinned !== undefined && { pinned: pinned === 'true' }),
    })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.snippetService.findOne(id, DEV_USER_ID)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSnippetDto) {
    return this.snippetService.create(DEV_USER_ID, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSnippetDto) {
    return this.snippetService.update(id, DEV_USER_ID, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.snippetService.remove(id, DEV_USER_ID)
  }
}
