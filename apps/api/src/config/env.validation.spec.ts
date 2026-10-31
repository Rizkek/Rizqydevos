import { describe, expect, it } from 'vitest'
import { envValidation } from './env.validation'

// Placeholders only; none of these are real credentials.
const base = {
  NODE_ENV: 'development',
  APP_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/devos',
  BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-00',
  BETTER_AUTH_URL: 'http://localhost:3000',
}

const KEY_32_BYTES = 'k'.repeat(32)

describe('envValidation', () => {
  it('accepts the minimal development config and applies defaults', () => {
    const env = envValidation(base)
    expect(env.PORT).toBe(3001)
    expect(env.TRUST_PROXY_HOPS).toBe(0)
    expect(env.REDIS_URL).toBe('redis://localhost:6379')
  })

  it('treats an empty value (`KEY=` in a .env file) as unset', () => {
    expect(() => envValidation({ ...base, ENCRYPTION_KEY: '', REDIS_URL: '' })).not.toThrow()
    expect(envValidation({ ...base, REDIS_URL: '' }).REDIS_URL).toBe('redis://localhost:6379')
  })

  it('requires BETTER_AUTH_URL, because the API verifies sessions through it', () => {
    const { BETTER_AUTH_URL: _omitted, ...withoutAuthUrl } = base
    expect(() => envValidation(withoutAuthUrl)).toThrow(/BETTER_AUTH_URL/)
  })

  it('rejects an encryption key that is not exactly 32 bytes', () => {
    expect(() => envValidation({ ...base, ENCRYPTION_KEY: 'k'.repeat(33) })).toThrow(/ENCRYPTION_KEY/)
    expect(() => envValidation({ ...base, ENCRYPTION_KEY: 'k'.repeat(31) })).toThrow(/ENCRYPTION_KEY/)
    expect(() => envValidation({ ...base, ENCRYPTION_KEY: KEY_32_BYTES })).not.toThrow()
  })

  it('requires an encryption key in production, also when it is left empty', () => {
    expect(() => envValidation({ ...base, NODE_ENV: 'production' })).toThrow(/ENCRYPTION_KEY is required/)
    expect(() => envValidation({ ...base, NODE_ENV: 'production', ENCRYPTION_KEY: '' })).toThrow(/ENCRYPTION_KEY is required/)
    expect(() => envValidation({ ...base, NODE_ENV: 'production', ENCRYPTION_KEY: KEY_32_BYTES })).not.toThrow()
  })
})
