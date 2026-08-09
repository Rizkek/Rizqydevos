import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common'
import { SettingsService } from './settings.service'
import { UpdateSettingsDto } from './dto/update-settings.dto'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'

@Controller('settings')
@UseGuards(AuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findOne(@CurrentUser('id') userId: string) {
    return this.settingsService.findOrCreate(userId)
  }

  @Patch()
  update(@Body() dto: UpdateSettingsDto, @CurrentUser('id') userId: string) {
    return this.settingsService.update(userId, dto)
  }
}
