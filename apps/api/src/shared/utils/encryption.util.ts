import * as crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH_BYTES = 32

const getSecretKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY
  if (!key || Buffer.byteLength(key, 'utf8') !== KEY_LENGTH_BYTES) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 UTF-8 bytes')
  }

  return Buffer.from(key, 'utf8')
}

export function encrypt(text: string): string {
  if (!text) return text
  
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag().toString('hex')
  
  // Format: iv:authTag:encryptedText
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText
  
  try {
    const parts = encryptedText.split(':')
    const iv = Buffer.from(parts[0]!, 'hex')
    const authTag = Buffer.from(parts[1]!, 'hex')
    const encrypted = parts[2]!
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    throw new Error('Unable to decrypt value', { cause: error })
  }
}
