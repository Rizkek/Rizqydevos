import * as crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

// Secret key should be 32 bytes
const getSecretKey = () => {
  const key = process.env.ENCRYPTION_KEY || 'devos-super-secret-key-must-be-32'
  if (key.length !== 32) {
    // Pad or truncate to 32 bytes for dev safely
    return Buffer.from(key.padEnd(32, '0').slice(0, 32))
  }
  return Buffer.from(key)
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
    console.error('Decryption failed', error)
    return '' // or throw
  }
}
