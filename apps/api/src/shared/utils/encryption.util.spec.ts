import { describe, expect, it } from 'vitest'
import { decryptWithKey, encryptWithKey, parseEncryptionKey, reencrypt } from './encryption.util'

const OLD = parseEncryptionKey('o'.repeat(32))
const NEW = parseEncryptionKey('ab'.repeat(32))

describe('encryption util', () => {
  it('accepts 32 characters, 64 hex characters, and base64 of 32 bytes', () => {
    expect(parseEncryptionKey('k'.repeat(32))).toHaveLength(32)
    expect(parseEncryptionKey('0f'.repeat(32))).toHaveLength(32)
    expect(parseEncryptionKey(Buffer.alloc(32, 7).toString('base64'))).toHaveLength(32)
  })

  it('rejects a key that is not exactly 32 bytes, such as the 33-character key that broke startup', () => {
    expect(() => parseEncryptionKey('k'.repeat(33))).toThrow(/exactly 32 bytes/)
    expect(() => parseEncryptionKey(undefined)).toThrow(/must be configured/)
  })

  it('re-encrypts a value so that only the new key opens it', () => {
    const stored = encryptWithKey('test-token', OLD)
    const rotated = reencrypt(stored, OLD, NEW)
    expect(decryptWithKey(rotated, NEW)).toBe('test-token')
    expect(() => decryptWithKey(rotated, OLD)).toThrow(/Unable to decrypt/)
  })

  it('fails rotation loudly when the old key is wrong, instead of writing garbage', () => {
    const stored = encryptWithKey('test-token', NEW)
    expect(() => reencrypt(stored, OLD, NEW)).toThrow(/Unable to decrypt/)
  })

  it('leaves empty values (deleted secrets) and pre-encryption plaintext as they are', () => {
    expect(reencrypt('', OLD, NEW)).toBe('')
    expect(decryptWithKey('legacy-plain', OLD)).toBe('legacy-plain')
  })
})
