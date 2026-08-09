import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateIntegrationDto, UpdateIntegrationDto } from './dto/integration.dto'
import { encrypt, decrypt } from '../../shared/utils/encryption.util'

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(userId: string, dto: CreateIntegrationDto) {
    const existing = await this.prisma.integration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: dto.provider,
        },
      },
    })

    const encryptedAccessToken = dto.accessToken ? encrypt(dto.accessToken) : undefined
    const encryptedRefreshToken = dto.refreshToken ? encrypt(dto.refreshToken) : undefined

    if (existing) {
      return this.prisma.integration.update({
        where: { id: existing.id },
        data: {
          ...(encryptedAccessToken && { accessToken: encryptedAccessToken }),
          ...(encryptedRefreshToken && { refreshToken: encryptedRefreshToken }),
          ...(dto.metadata && { metadata: dto.metadata }),
        },
      })
    }

    return this.prisma.integration.create({
      data: {
        userId,
        provider: dto.provider,
        accessToken: encryptedAccessToken ?? null,
        refreshToken: encryptedRefreshToken ?? null,
        metadata: dto.metadata ?? {},
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
