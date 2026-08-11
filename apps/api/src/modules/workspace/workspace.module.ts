import { Module } from '@nestjs/common'
import { TodoController } from './todo.controller'
import { TodoService } from './todo.service'
import { NotesController } from './notes.controller'
import { NotesService } from './notes.service'
import { BookmarksController } from './bookmarks.controller'
import { BookmarksService } from './bookmarks.service'

@Module({
  controllers: [TodoController, NotesController, BookmarksController],
  providers: [TodoService, NotesService, BookmarksService],
  exports: [TodoService, NotesService, BookmarksService],
})
export class WorkspaceModule {}
