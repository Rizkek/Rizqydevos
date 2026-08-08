import { Controller, Get, Patch, Body } from '@nestjs/common'
import { SettingsService } from './settings.service'
import { UpdateSettingsDto } from './dto/update-settings.dto'

const DEV_USER_ID = 'dev-user-placeholder'

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findOne() {
    return this.settingsService.findOrCreate(DEV_USER_ID)
  }

  @Patch()
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(DEV_USER_ID, dto)
  }
}
