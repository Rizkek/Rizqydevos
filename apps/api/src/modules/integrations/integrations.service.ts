import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'
import { encrypt, decrypt } from '../../shared/utils/encryption.util'
import { IntegrationMetadata, IntegrationProvider } from './integration-provider'
import { disabled, notConfigured, tokenUnreadable } from './integration.errors'

export interface IntegrationSummary {
  id: string
  provider: string
  enabled: boolean
  metadata: IntegrationMetadata
  updatedAt: Date
}

export interface IntegrationCredentials {
  token: string
  metadata: IntegrationMetadata
}

const summarySelect = {
  id: true,
  provider: true,
  enabled: true,
  metadata: true,
  updatedAt: true,
} satisfies Prisma.IntegrationSelect

function toMetadata(value: Prisma.JsonValue | null): IntegrationMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const { accountLogin, teamId } = value as Record<string, unknown>
  return {
    ...(typeof accountLogin === 'string' && { accountLogin }),
    ...(typeof teamId === 'string' && { teamId }),
  }
}

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Reconnecting always re-enables: the user just supplied a fresh token.
  async upsert(
    userId: string,
    provider: IntegrationProvider,
    accessToken: string,
    metadata: IntegrationMetadata,
  ): Promise<IntegrationSummary> {
    const encryptedAccessToken = encrypt(accessToken)
    const row = await this.prisma.integration.upsert({
      where: { userId_provider: { userId, provider } },
      create: { userId, provider, accessToken: encryptedAccessToken, metadata: metadata as Prisma.InputJsonValue },
      update: { accessToken: encryptedAccessToken, metadata: metadata as Prisma.InputJsonValue, enabled: true },
      select: summarySelect,
    })
    return { ...row, metadata: toMetadata(row.metadata) }
  }

  // Never selects token columns, so a summary can never leak one.
  async list(userId: string): Promise<IntegrationSummary[]> {
    const rows = await this.prisma.integration.findMany({
      where: { userId },
      select: summarySelect,
      orderBy: { provider: 'asc' },
    })
    return rows.map((row) => ({ ...row, metadata: toMetadata(row.metadata) }))
  }

  async getCredentials(userId: string, provider: IntegrationProvider): Promise<IntegrationCredentials> {
    const row = await this.prisma.integration.findUnique({
      where: { userId_provider: { userId, provider } },
    })

    if (!row || !row.accessToken) throw notConfigured(provider)
    if (!row.enabled) throw disabled(provider)

    try {
      return { token: decrypt(row.accessToken), metadata: toMetadata(row.metadata) }
    } catch {
      // Typically ENCRYPTION_KEY was rotated. Only reconnecting can fix it.
      throw tokenUnreadable(provider)
    }
  }

  async setEnabled(userId: string, provider: IntegrationProvider, enabled: boolean): Promise<IntegrationSummary> {
    const { count } = await this.prisma.integration.updateMany({
      where: { userId, provider },
      data: { enabled },
    })
    if (count === 0) throw notConfigured(provider)

    const row = await this.prisma.integration.findUniqueOrThrow({
      where: { userId_provider: { userId, provider } },
      select: summarySelect,
    })
    return { ...row, metadata: toMetadata(row.metadata) }
  }

  // Idempotent: disconnecting something that is not connected is not an error.
  async remove(userId: string, provider: IntegrationProvider): Promise<boolean> {
    const { count } = await this.prisma.integration.deleteMany({ where: { userId, provider } })
    return count > 0
  }
}
