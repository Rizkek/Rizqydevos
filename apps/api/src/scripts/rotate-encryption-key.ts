// Re-encrypts every stored secret value and integration token from OLD_ENCRYPTION_KEY to NEW_ENCRYPTION_KEY.
// Run it yourself, with the API stopped, from apps/api:
//   OLD_ENCRYPTION_KEY=... NEW_ENCRYPTION_KEY=... DATABASE_URL=... bun src/scripts/rotate-encryption-key.ts
// Add DRY_RUN=1 to check that every value decrypts with the old key without writing anything.
// Afterwards set ENCRYPTION_KEY to the new key everywhere the API runs. Prints counts only, never values.
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { parseEncryptionKey, reencrypt } from '../shared/utils/encryption.util'

async function main() {
  const oldKey = parseEncryptionKey(process.env.OLD_ENCRYPTION_KEY)
  const newKey = parseEncryptionKey(process.env.NEW_ENCRYPTION_KEY)
  const dryRun = process.env.DRY_RUN === '1'
  if (oldKey.equals(newKey)) throw new Error('OLD_ENCRYPTION_KEY and NEW_ENCRYPTION_KEY are the same.')

  const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) })
  try {
    const counts = await prisma.$transaction(async (tx) => {
      const secrets = await tx.secret.findMany({ select: { id: true, value: true } })
      const integrations = await tx.integration.findMany({ select: { id: true, accessToken: true, refreshToken: true } })

      // Decrypt everything first: a value that does not open with the old key aborts before any write.
      const secretUpdates = secrets.map((s) => ({ id: s.id, value: reencrypt(s.value, oldKey, newKey) }))
      const integrationUpdates = integrations.map((i) => ({
        id: i.id,
        accessToken: i.accessToken ? reencrypt(i.accessToken, oldKey, newKey) : i.accessToken,
        refreshToken: i.refreshToken ? reencrypt(i.refreshToken, oldKey, newKey) : i.refreshToken,
      }))

      if (!dryRun) {
        for (const s of secretUpdates) await tx.secret.update({ where: { id: s.id }, data: { value: s.value } })
        for (const i of integrationUpdates) {
          await tx.integration.update({ where: { id: i.id }, data: { accessToken: i.accessToken, refreshToken: i.refreshToken } })
        }
      }
      return { secrets: secretUpdates.length, integrations: integrationUpdates.length }
    }, { timeout: 120_000 })

    console.log(`${dryRun ? 'Dry run: would re-encrypt' : 'Re-encrypted'} ${counts.secrets} secrets and ${counts.integrations} integrations.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  // Only the message: never print values or the stack of a decryption error with its cause.
  console.error('Rotation failed, nothing was written:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
