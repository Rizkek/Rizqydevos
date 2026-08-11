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
import { NotesService } from './notes.service'
import { CreateNoteDto } from './dto/create-note.dto'
import { UpdateNoteDto } from './dto/update-note.dto'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'

@Controller('workspace/notes')
@UseGuards(AuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.notesService.findAll(userId)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notesService.findOne(id, userId)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateNoteDto, @CurrentUser('id') userId: string) {
    return this.notesService.create(userId, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto, @CurrentUser('id') userId: string) {
    return this.notesService.update(id, userId, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.notesService.remove(id, userId)
  }
}
