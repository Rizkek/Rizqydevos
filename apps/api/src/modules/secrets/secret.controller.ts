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
import { Throttle } from '@nestjs/throttler'
import { SecretService } from './secret.service'
import { CreateSecretDto, ExportSecretsDto, ImportSecretsDto, RestoreSecretsDto, UpdateSecretDto } from './dto/secret.dto'
import { AuthGuard, type AuthenticatedSession } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { CurrentSession } from '../../shared/decorators/current-session.decorator'
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto'

@Controller('secrets')
@UseGuards(AuthGuard)
export class SecretController {
  constructor(private readonly secretService: SecretService) {}

  @Get()
  findAll(@Query() pagination: PaginationQueryDto, @CurrentUser('id') userId: string) {
    return this.secretService.findAll(userId, pagination)
  }

  // Declared before :id routes so "backup" is not read as an id.
  @Post('backup')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  exportBackup(@Body() dto: ExportSecretsDto, @CurrentUser('id') userId: string, @CurrentSession() session: AuthenticatedSession | null) {
    return this.secretService.exportBackup(userId, dto.passphrase, session)
  }

  @Post('restore')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  restoreBackup(@Body() dto: RestoreSecretsDto, @CurrentUser('id') userId: string, @CurrentSession() session: AuthenticatedSession | null) {
    return this.secretService.restoreBackup(userId, dto.passphrase, dto.backup, session)
  }

  // Rows from a password manager CSV, parsed in the browser. dryRun gives the counts for the preview.
  @Post('import')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  importMany(@Body() dto: ImportSecretsDto, @CurrentUser('id') userId: string) {
    return this.secretService.importMany(userId, dto)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.secretService.findOne(id, userId)
  }

  /** Returns the decrypted value — audited, needs a recent sign-in */
  @Get(':id/reveal')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  reveal(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentSession() session: AuthenticatedSession | null) {
    return this.secretService.reveal(id, userId, session)
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
