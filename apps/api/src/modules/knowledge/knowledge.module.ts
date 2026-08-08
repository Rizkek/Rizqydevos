import { Module } from '@nestjs/common'
import { SnippetController } from './snippet.controller'
import { SnippetService } from './snippet.service'

@Module({
  controllers: [SnippetController],
  providers: [SnippetService],
  exports: [SnippetService],
})
export class KnowledgeModule {}
