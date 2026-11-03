import * as crypto from 'crypto'
import { BadRequestException } from '@nestjs/common'

// A backup is readable without ENCRYPTION_KEY: it is sealed with a key derived from the owner's passphrase,
// so it can restore the vault on a new server or after the key is lost.
export const BACKUP_FORMAT = 'devos-secrets-backup'
// Version 2 adds username, url, and tags. Version 1 files (without them) still restore.
export const BACKUP_VERSION = 2
const READABLE_VERSIONS = [1, 2]
// scrypt N=2^15, r=8 uses 32 MiB; maxmem must allow it (Node's default limit is exactly 32 MiB).
const SCRYPT = { N: 2 ** 15, r: 8, p: 1 }
const SCRYPT_MAXMEM = 64 * 1024 * 1024

export interface BackupSecret {
  name: string
  key: string
  value: string
  username: string
  url: string | null
  tags: string[]
  category: string | null
  description: string | null
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT
  version: number
  createdAt: string
  kdf: { name: 'scrypt'; N: number; r: number; p: number; salt: string }
  cipher: { name: 'aes-256-gcm'; iv: string; tag: string }
  data: string
}

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.scryptSync(passphrase, salt, 32, { ...SCRYPT, maxmem: SCRYPT_MAXMEM })
}

export function sealBackup(secrets: BackupSecret[], passphrase: string, now = new Date()): BackupFile {
  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(passphrase, salt), iv)
  const data = Buffer.concat([cipher.update(JSON.stringify(secrets), 'utf8'), cipher.final()])

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: now.toISOString(),
    kdf: { name: 'scrypt', ...SCRYPT, salt: salt.toString('base64') },
    cipher: { name: 'aes-256-gcm', iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64') },
    data: data.toString('base64'),
  }
}

function invalidBackup(message: string): BadRequestException {
  return new BadRequestException({ message, error: 'INVALID_BACKUP' })
}

function isBackupFile(value: unknown): value is BackupFile {
  const file = value as Partial<BackupFile> | null
  return Boolean(
    file && file.format === BACKUP_FORMAT && typeof file.version === 'number' && READABLE_VERSIONS.includes(file.version)
      // Fixed parameters: a crafted file must not choose a cost that exhausts the server.
      && file.kdf?.name === 'scrypt' && file.kdf.N === SCRYPT.N && file.kdf.r === SCRYPT.r && file.kdf.p === SCRYPT.p
      && typeof file.kdf.salt === 'string'
      && file.cipher?.name === 'aes-256-gcm' && typeof file.cipher.iv === 'string' && typeof file.cipher.tag === 'string'
      && typeof file.data === 'string',
  )
}

function isBackupSecret(value: unknown): value is BackupSecret {
  const s = value as Partial<BackupSecret> | null
  return Boolean(s && typeof s.name === 'string' && typeof s.key === 'string' && typeof s.value === 'string')
}

export function openBackup(file: unknown, passphrase: string): BackupSecret[] {
  if (!isBackupFile(file)) throw invalidBackup('This is not a DevOS secrets backup.')

  let plaintext: string
  try {
    const key = deriveKey(passphrase, Buffer.from(file.kdf.salt, 'base64'))
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(file.cipher.iv, 'base64'))
    decipher.setAuthTag(Buffer.from(file.cipher.tag, 'base64'))
    plaintext = Buffer.concat([decipher.update(Buffer.from(file.data, 'base64')), decipher.final()]).toString('utf8')
  } catch {
    // A wrong passphrase and a tampered file fail the same authentication check.
    throw invalidBackup('Wrong passphrase, or the backup file was changed.')
  }

  const secrets: unknown = JSON.parse(plaintext)
  if (!Array.isArray(secrets) || !secrets.every(isBackupSecret)) throw invalidBackup('The backup content is not valid.')
  return secrets.map((s) => ({
    name: s.name,
    key: s.key,
    value: s.value,
    username: typeof s.username === 'string' ? s.username : '',
    url: typeof s.url === 'string' ? s.url : null,
    tags: Array.isArray(s.tags) ? s.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    category: s.category ?? null,
    description: s.description ?? null,
  }))
}
