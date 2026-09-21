import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { SecretService } from './secret.service'
import { CreateSecretDto, UpdateSecretDto } from './dto/secret.dto'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto'

@Controller('secrets')
@UseGuards(AuthGuard)
export class SecretController {
  constructor(private readonly secretService: SecretService) {}

  @Get()
  findAll(@Query() pagination: PaginationQueryDto, @CurrentUser('id') userId: string) {
    return this.secretService.findAll(userId, pagination)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.secretService.findOne(id, userId)
  }

  /** Returns the decrypted value — audited */
  @Get(':id/reveal')
  reveal(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.secretService.reveal(id, userId)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSecretDto, @CurrentUser('id') userId: string) {
    return this.secretService.create(userId, dto)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSecretDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.secretService.update(id, userId, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.secretService.remove(id, userId)
  }
}
