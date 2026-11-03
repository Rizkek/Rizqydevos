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
import { BookmarksService } from './bookmarks.service'
import { CreateBookmarkDto } from './dto/create-bookmark.dto'
import { UpdateBookmarkDto } from './dto/update-bookmark.dto'
import { ImportBookmarksDto } from './dto/import-bookmarks.dto'
import { Throttle } from '@nestjs/throttler'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto'

@Controller('workspace/bookmarks')
@UseGuards(AuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  findAll(@Query() pagination: PaginationQueryDto, @CurrentUser('id') userId: string) {
    return this.bookmarksService.findAll(userId, pagination)
  }

  // Declared before :id so "all" is not read as an id.
  @Get('all')
  findEverything(@CurrentUser('id') userId: string) {
    return this.bookmarksService.findEverything(userId)
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

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  importMany(@Body() dto: ImportBookmarksDto, @CurrentUser('id') userId: string) {
    return this.bookmarksService.importMany(userId, dto)
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
