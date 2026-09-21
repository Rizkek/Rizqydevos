import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { UpdateSettingsDto } from './dto/update-settings.dto'

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(userId: string) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    })
  }

  async update(userId: string, dto: UpdateSettingsDto) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        theme: dto.theme ?? 'dark',
        density: dto.density ?? 'normal',
        accentColor: dto.accentColor ?? 'violet',
        sidebarOpen: dto.sidebarOpen ?? true,
      },
      update: {
        ...(dto.theme !== undefined && { theme: dto.theme }),
        ...(dto.density !== undefined && { density: dto.density }),
        ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
        ...(dto.sidebarOpen !== undefined && { sidebarOpen: dto.sidebarOpen }),
      },
    })
  }
}
