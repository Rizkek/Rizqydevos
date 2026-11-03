import * as crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH_BYTES = 32

// Accepts 32 UTF-8 bytes, 64 hex characters, or base64 of 32 bytes (same rule as env.validation.ts).
export function parseEncryptionKey(key: string | undefined): Buffer {
  if (!key) {
    throw new Error('ENCRYPTION_KEY must be configured')
  }

  if (Buffer.byteLength(key, 'utf8') === KEY_LENGTH_BYTES) {
    return Buffer.from(key, 'utf8')
  }

  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    return Buffer.from(key, 'hex')
  }

  if (/^[A-Za-z0-9+/]{43}={0,1}$/.test(key)) {
    const decoded = Buffer.from(key, 'base64')
    if (decoded.length === KEY_LENGTH_BYTES) return decoded
  }

  throw new Error('ENCRYPTION_KEY must encode exactly 32 bytes')
}

const getSecretKey = (): Buffer => parseEncryptionKey(process.env.ENCRYPTION_KEY)

export function encryptWithKey(text: string, key: Buffer): string {
  if (!text) return text

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag().toString('hex')

  // Format: iv:authTag:encryptedText
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decryptWithKey(encryptedText: string, key: Buffer): string {
  // Values written before encryption existed have no separators and are returned as they are.
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText

  try {
    const [ivHex = '', tagHex = '', encrypted = ''] = encryptedText.split(':')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    throw new Error('Unable to decrypt value', { cause: error })
  }
}

export function encrypt(text: string): string {
  return encryptWithKey(text, getSecretKey())
}

export function decrypt(encryptedText: string): string {
  return decryptWithKey(encryptedText, getSecretKey())
}

// Used by the key rotation script: re-encrypts one stored value from the old key to the new key.
export function reencrypt(value: string, oldKey: Buffer, newKey: Buffer): string {
  if (!value) return value
  return encryptWithKey(decryptWithKey(value, oldKey), newKey)
}
