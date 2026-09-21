import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { NoteService } from './note.service'
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'

import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto'

@Controller('knowledge/notes')
@UseGuards(AuthGuard)
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationQueryDto,
    @Query('pinned') pinned?: string,
  ) {
    return this.noteService.findAll(
      userId,
      { ...(pinned !== undefined && { pinned: pinned === 'true' }) },
      pagination,
    )
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.noteService.findOne(id, userId)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateNoteDto, @CurrentUser('id') userId: string) {
    return this.noteService.create(userId, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto, @CurrentUser('id') userId: string) {
    return this.noteService.update(id, userId, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.noteService.remove(id, userId)
  }
}
