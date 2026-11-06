import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isTwoFactorEnabled, needsSecondFactor, normalizeCode, totpSecretFromUri, verifySecondFactor } from './two-factor'

const mocks = vi.hoisted(() => ({ verifyTotp: vi.fn(), verifyBackupCode: vi.fn() }))

vi.mock('@/lib/auth-client', () => ({ twoFactor: { verifyTotp: mocks.verifyTotp, verifyBackupCode: mocks.verifyBackupCode } }))

describe('needsSecondFactor', () => {
  it('is true only when the sign-in answer asks for the second step', () => {
    expect(needsSecondFactor({ twoFactorRedirect: true, twoFactorMethods: ['totp'] })).toBe(true)
    expect(needsSecondFactor({ twoFactorRedirect: false })).toBe(false)
    expect(needsSecondFactor({ token: 'abc', user: { id: '1' } })).toBe(false)
    expect(needsSecondFactor(null)).toBe(false)
    expect(needsSecondFactor(undefined)).toBe(false)
  })
})

describe('isTwoFactorEnabled', () => {
  it('reads the flag from the session user and treats anything else as off', () => {
    expect(isTwoFactorEnabled({ twoFactorEnabled: true })).toBe(true)
    expect(isTwoFactorEnabled({ twoFactorEnabled: false })).toBe(false)
    expect(isTwoFactorEnabled({ twoFactorEnabled: null })).toBe(false)
    expect(isTwoFactorEnabled({ email: 'a@b.c' })).toBe(false)
    expect(isTwoFactorEnabled(undefined)).toBe(false)
  })
})

describe('totpSecretFromUri', () => {
  it('returns the shared secret from the setup link', () => {
    expect(totpSecretFromUri('otpauth://totp/DevOS:owner%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=DevOS')).toBe('JBSWY3DPEHPK3PXP')
  })

  it('returns null for text that is not a link or has no secret', () => {
    expect(totpSecretFromUri('not a link')).toBeNull()
    expect(totpSecretFromUri('otpauth://totp/DevOS:owner?issuer=DevOS')).toBeNull()
  })
})

describe('normalizeCode', () => {
  it('removes spaces from authenticator codes but keeps the dash in backup codes', () => {
    expect(normalizeCode('totp', ' 123 456 ')).toBe('123456')
    expect(normalizeCode('backup', ' abcde-fghij ')).toBe('abcde-fghij')
  })
})

describe('verifySecondFactor', () => {
  beforeEach(() => {
    mocks.verifyTotp.mockReset()
    mocks.verifyBackupCode.mockReset()
  })

  it('sends an authenticator code without spaces and reports success as null', async () => {
    mocks.verifyTotp.mockResolvedValue({ error: null })
    await expect(verifySecondFactor('totp', '123 456')).resolves.toBeNull()
    expect(mocks.verifyTotp).toHaveBeenCalledWith({ code: '123456' })
    expect(mocks.verifyBackupCode).not.toHaveBeenCalled()
  })

  it('sends a backup code to the backup endpoint', async () => {
    mocks.verifyBackupCode.mockResolvedValue({ error: null })
    await expect(verifySecondFactor('backup', 'abcde-fghij')).resolves.toBeNull()
    expect(mocks.verifyBackupCode).toHaveBeenCalledWith({ code: 'abcde-fghij' })
  })

  it('does not call the server for an empty code', async () => {
    await expect(verifySecondFactor('totp', '  ')).resolves.toMatch(/enter the code/i)
    expect(mocks.verifyTotp).not.toHaveBeenCalled()
  })

  it('gives a plain message for a wrong code', async () => {
    mocks.verifyTotp.mockResolvedValue({ error: { status: 401, message: 'Invalid code' } })
    await expect(verifySecondFactor('totp', '000000')).resolves.toMatch(/not right/i)
  })

  it('passes on the lockout message after too many wrong codes', async () => {
    mocks.verifyTotp.mockResolvedValue({ error: { status: 429, message: 'Too many failed attempts. Try again later.' } })
    await expect(verifySecondFactor('totp', '000000')).resolves.toBe('Too many failed attempts. Try again later.')
  })
})
