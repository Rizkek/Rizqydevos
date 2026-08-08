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
  ParseBoolPipe,
} from '@nestjs/common'
import { TodoService } from './todo.service'
import { CreateTodoDto } from './dto/create-todo.dto'
import { UpdateTodoDto } from './dto/update-todo.dto'

// NOTE: Auth guard will be applied in Phase 2.
// For now, userId is extracted from a request header to allow local development.
const DEV_USER_ID = 'dev-user-placeholder'

@Controller('workspace/todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  findAll(
    @Query('completed') completed?: string,
    @Query('priority') priority?: string,
  ) {
    const filters = {
      completed: completed !== undefined ? completed === 'true' : undefined,
      priority,
    }
    return this.todoService.findAll(DEV_USER_ID, filters)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.todoService.findOne(id, DEV_USER_ID)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTodoDto) {
    return this.todoService.create(DEV_USER_ID, dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTodoDto) {
    return this.todoService.update(id, DEV_USER_ID, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.todoService.remove(id, DEV_USER_ID)
  }
}
