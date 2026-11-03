import { describe, expect, it } from 'vitest'
import { openBackup, sealBackup, type BackupSecret } from './backup-crypto'

const secrets: BackupSecret[] = [
  { name: 'GitHub', key: 'GITHUB_TOKEN', username: '', url: null, tags: [], value: 'test-token', category: 'api-key', description: null },
  { name: 'Example login', key: 'example.com', username: 'ada', url: 'https://example.com/login', tags: ['work'], value: 'test-password', category: 'password', description: 'second account' },
]
const PASSPHRASE = 'a long enough passphrase'

describe('backup crypto', () => {
  it('opens what it sealed with the same passphrase', () => {
    expect(openBackup(sealBackup(secrets, PASSPHRASE), PASSPHRASE)).toEqual(secrets)
  })

  it('does not contain the values in readable form', () => {
    const sealed = JSON.stringify(sealBackup(secrets, PASSPHRASE))
    expect(sealed).not.toContain('test-token')
    expect(sealed).not.toContain('test-password')
    expect(sealed).not.toContain('ada')
  })

  it('still opens a version 1 backup, which has no username, url, or tags', () => {
    const legacy = [{ name: 'Old', key: 'OLD_KEY', value: 'old-value', category: null, description: null }] as unknown as BackupSecret[]
    const file = { ...sealBackup(legacy, PASSPHRASE), version: 1 }
    expect(openBackup(file, PASSPHRASE)).toEqual([{ name: 'Old', key: 'OLD_KEY', value: 'old-value', username: '', url: null, tags: [], category: null, description: null }])
  })

  it('refuses a version it does not know', () => {
    expect(() => openBackup({ ...sealBackup(secrets, PASSPHRASE), version: 99 }, PASSPHRASE)).toThrow(/not a DevOS secrets backup/)
  })

  it('uses a new salt and iv for every backup', () => {
    const a = sealBackup(secrets, PASSPHRASE)
    const b = sealBackup(secrets, PASSPHRASE)
    expect(a.kdf.salt).not.toBe(b.kdf.salt)
    expect(a.cipher.iv).not.toBe(b.cipher.iv)
  })

  it('rejects a wrong passphrase and a tampered file', () => {
    const backup = sealBackup(secrets, PASSPHRASE)
    expect(() => openBackup(backup, 'another passphrase')).toThrow(/wrong passphrase/i)
    const tampered = { ...backup, data: Buffer.from('x'.repeat(40)).toString('base64') }
    expect(() => openBackup(tampered, PASSPHRASE)).toThrow(/wrong passphrase/i)
  })

  it('refuses files that are not a backup or that ask for a different scrypt cost', () => {
    expect(() => openBackup({ hello: 'world' }, PASSPHRASE)).toThrow(/not a DevOS secrets backup/)
    const backup = sealBackup(secrets, PASSPHRASE)
    expect(() => openBackup({ ...backup, kdf: { ...backup.kdf, N: 2 ** 24 } }, PASSPHRASE)).toThrow(/not a DevOS secrets backup/)
  })
})
