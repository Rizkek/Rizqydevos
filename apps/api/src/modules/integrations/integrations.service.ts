import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateIntegrationDto, UpdateIntegrationDto } from './dto/integration.dto'
import { encrypt, decrypt } from '../../shared/utils/encryption.util'

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(userId: string, dto: CreateIntegrationDto) {
    const encryptedAccessToken = dto.accessToken ? encrypt(dto.accessToken) : undefined
    const encryptedRefreshToken = dto.refreshToken ? encrypt(dto.refreshToken) : undefined

    return this.prisma.integration.upsert({
      where: {
        userId_provider: {
          userId,
          provider: dto.provider!,
        },
      },
      create: {
        userId,
        provider: dto.provider!,
        accessToken: encryptedAccessToken ?? null,
        refreshToken: encryptedRefreshToken ?? null,
        metadata: dto.metadata ?? {},
      },
      update: {
        ...(encryptedAccessToken && { accessToken: encryptedAccessToken }),
        ...(encryptedRefreshToken && { refreshToken: encryptedRefreshToken }),
        ...(dto.metadata && { metadata: dto.metadata }),
      },
    })
  }

  async getIntegration(userId: string, provider: string) {
    const integration = await this.prisma.integration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    })

    if (!integration) return null

    return {
      ...integration,
      accessToken: integration.accessToken ? decrypt(integration.accessToken) : null,
      refreshToken: integration.refreshToken ? decrypt(integration.refreshToken) : null,
    }
  }

  async getUserIntegrations(userId: string) {
    return this.prisma.integration.findMany({
      where: { userId },
    })
  }

  async getDecryptedToken(userId: string, provider: string): Promise<string | null> {
    const integration = await this.getIntegration(userId, provider)
    if (!integration || !integration.enabled) return null
    return integration.accessToken
  }

  async remove(userId: string, provider: string) {
    return this.prisma.integration.delete({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    })
  }
}
