// @vitest-environment node
import { createHmac } from 'node:crypto'
import { betterAuth } from 'better-auth'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { twoFactor } from 'better-auth/plugins'
import { describe, expect, it } from 'vitest'

// Runs the real better-auth with the same plugin options as lib/auth.ts and an in-memory store, so the
// shape of the two-factor sign-in that the login page and the password dialog rely on is checked against the library.
function createAuth() {
  return betterAuth({
    database: memoryAdapter({ user: [], session: [], account: [], verification: [], twoFactor: [] }),
    secret: 'test-secret-test-secret-test-secret-0',
    baseURL: 'http://localhost:3000',
    emailAndPassword: { enabled: true },
    plugins: [twoFactor({ issuer: 'DevOS' })],
  })
}

const EMAIL = 'owner@example.com'
const PASSWORD = 'Passw0rd123'

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Decode(input: string): Buffer {
  let bits = ''
  for (const char of input.replace(/=+$/, '').toUpperCase()) bits += BASE32.indexOf(char).toString(2).padStart(5, '0')
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

// RFC 6238 with the defaults the plugin uses: SHA-1, 6 digits, 30 second steps.
function totp(secretBase32: string, now = Date.now()): string {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30_000)))
  const hmac = createHmac('sha1', base32Decode(secretBase32)).update(counter).digest()
  const offset = hmac[hmac.length - 1]! & 0xf
  const value = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000
  return String(value).padStart(6, '0')
}

// Cookies from a response, in the form a browser would send them back.
function cookiesFrom(headers: Headers): string {
  return headers.getSetCookie().map((cookie) => cookie.split(';')[0]).join('; ')
}

async function ownerWithTwoFactor() {
  const auth = createAuth()
  const signUp = await auth.api.signUpEmail({ body: { name: 'Owner', email: EMAIL, password: PASSWORD }, returnHeaders: true })
  const session = new Headers({ cookie: cookiesFrom(signUp.headers) })

  const setup = await auth.api.enableTwoFactor({ body: { password: PASSWORD }, headers: session })
  // The plugin also supports an email code method; without a mail sender only the authenticator method is offered.
  if (!('totpURI' in setup)) throw new Error('Expected the authenticator method')
  const secret = new URL(setup.totpURI).searchParams.get('secret') ?? ''
  await auth.api.verifyTOTP({ body: { code: totp(secret) }, headers: session })
  return { auth, secret, setup }
}

describe('two-factor sign-in with better-auth', () => {
  it('gives the setup link, a shared secret, and backup codes when it is turned on', async () => {
    const { setup, secret } = await ownerWithTwoFactor()
    expect(setup.totpURI).toMatch(/^otpauth:\/\/totp\//)
    expect(secret).not.toBe('')
    expect(setup.backupCodes.length).toBeGreaterThan(0)
  })

  it('asks for a second step after the password and does not start a session yet', async () => {
    const { auth } = await ownerWithTwoFactor()
    const result = await auth.api.signInEmail({ body: { email: EMAIL, password: PASSWORD }, returnHeaders: true })
    expect(result.response).toMatchObject({ twoFactorRedirect: true })
    const session = await auth.api.getSession({ headers: new Headers({ cookie: cookiesFrom(result.headers) }) })
    expect(session).toBeNull()
  })

  it('finishes the sign-in with an authenticator code and rejects a wrong one', async () => {
    const { auth, secret } = await ownerWithTwoFactor()
    const result = await auth.api.signInEmail({ body: { email: EMAIL, password: PASSWORD }, returnHeaders: true })
    const pending = new Headers({ cookie: cookiesFrom(result.headers) })

    await expect(auth.api.verifyTOTP({ body: { code: '000000' }, headers: pending })).rejects.toBeDefined()

    const verified = await auth.api.verifyTOTP({ body: { code: totp(secret) }, headers: pending, returnHeaders: true })
    const session = await auth.api.getSession({ headers: new Headers({ cookie: cookiesFrom(verified.headers) }) })
    expect(session?.user.email).toBe(EMAIL)
  })

  it('accepts a backup code once', async () => {
    const { auth, setup } = await ownerWithTwoFactor()
    const code = setup.backupCodes[0]!

    const first = await auth.api.signInEmail({ body: { email: EMAIL, password: PASSWORD }, returnHeaders: true })
    const used = await auth.api.verifyBackupCode({ body: { code }, headers: new Headers({ cookie: cookiesFrom(first.headers) }), returnHeaders: true })
    expect((await auth.api.getSession({ headers: new Headers({ cookie: cookiesFrom(used.headers) }) }))?.user.email).toBe(EMAIL)

    const second = await auth.api.signInEmail({ body: { email: EMAIL, password: PASSWORD }, returnHeaders: true })
    await expect(auth.api.verifyBackupCode({ body: { code }, headers: new Headers({ cookie: cookiesFrom(second.headers) }) })).rejects.toBeDefined()
  })

  it('turns off with the password and then signs in without a second step', async () => {
    const { auth, secret } = await ownerWithTwoFactor()
    const result = await auth.api.signInEmail({ body: { email: EMAIL, password: PASSWORD }, returnHeaders: true })
    const verified = await auth.api.verifyTOTP({ body: { code: totp(secret) }, headers: new Headers({ cookie: cookiesFrom(result.headers) }), returnHeaders: true })
    const session = new Headers({ cookie: cookiesFrom(verified.headers) })

    await expect(auth.api.disableTwoFactor({ body: { password: 'wrong password' }, headers: session })).rejects.toBeDefined()
    await auth.api.disableTwoFactor({ body: { password: PASSWORD }, headers: session })

    const again = await auth.api.signInEmail({ body: { email: EMAIL, password: PASSWORD } })
    expect(again).not.toHaveProperty('twoFactorRedirect', true)
    expect(again.token).toBeTruthy()
  })
})

describe('re-signing in for the vault', () => {
  it('gives the new session a later createdAt, which the API uses for the 15 minute window', async () => {
    const auth = createAuth()
    const signUp = await auth.api.signUpEmail({ body: { name: 'Owner', email: EMAIL, password: PASSWORD }, returnHeaders: true })
    const first = await auth.api.getSession({ headers: new Headers({ cookie: cookiesFrom(signUp.headers) }) })

    await new Promise((resolve) => setTimeout(resolve, 20))
    const again = await auth.api.signInEmail({ body: { email: EMAIL, password: PASSWORD }, returnHeaders: true })
    const second = await auth.api.getSession({ headers: new Headers({ cookie: cookiesFrom(again.headers) }) })

    expect(first?.session.id).toBeTruthy()
    expect(second?.session.id).not.toBe(first?.session.id)
    expect(new Date(second!.session.createdAt).getTime()).toBeGreaterThan(new Date(first!.session.createdAt).getTime())
  })
})
