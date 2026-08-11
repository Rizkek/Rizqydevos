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
import { BookmarksService } from './bookmarks.service'
import { CreateBookmarkDto } from './dto/create-bookmark.dto'
import { UpdateBookmarkDto } from './dto/update-bookmark.dto'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'

@Controller('workspace/bookmarks')
@UseGuards(AuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.bookmarksService.findAll(userId)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.bookmarksService.findOne(id, userId)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBookmarkDto, @CurrentUser('id') userId: string) {
    return this.bookmarksService.create(userId, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBookmarkDto, @CurrentUser('id') userId: string) {
    return this.bookmarksService.update(id, userId, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.bookmarksService.remove(id, userId)
  }
}
