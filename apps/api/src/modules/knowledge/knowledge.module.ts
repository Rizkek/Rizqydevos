import { Module } from '@nestjs/common'
import { SnippetController } from './snippet.controller'
import { SnippetService } from './snippet.service'
import { NoteController } from './note.controller'
import { NoteService } from './note.service'

@Module({
  controllers: [SnippetController, NoteController],
  providers: [SnippetService, NoteService],
  exports: [SnippetService, NoteService],
})
export class KnowledgeModule {}
