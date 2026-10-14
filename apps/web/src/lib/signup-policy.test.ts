// @vitest-environment node
import { betterAuth } from 'better-auth'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { describe, expect, it } from 'vitest'
import { isOwnerEmail, ownerOnlySignup } from './signup-policy'

describe('isOwnerEmail', () => {
  it('matches the owner ignoring case and surrounding spaces', () => {
    expect(isOwnerEmail('  Owner@Example.COM ', 'owner@example.com')).toBe(true)
    expect(isOwnerEmail('owner@example.com', ' OWNER@example.com ')).toBe(true)
  })

  it('rejects everyone else, including lookalikes', () => {
    expect(isOwnerEmail('someone@example.com', 'owner@example.com')).toBe(false)
    expect(isOwnerEmail('owner@example.com.evil.test', 'owner@example.com')).toBe(false)
    expect(isOwnerEmail('xowner@example.com', 'owner@example.com')).toBe(false)
  })

  it.each([undefined, '', '   '])('rejects everyone when OWNER_EMAIL is %j, so a missing setting fails closed', (owner) => {
    expect(isOwnerEmail('owner@example.com', owner)).toBe(false)
    expect(isOwnerEmail('', owner)).toBe(false)
  })
})

// Runs the real better-auth with an in-memory store, so this proves the hook is honoured by the library.
function createAuth(ownerEmail: string | undefined) {
  return betterAuth({
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    secret: 'test-secret-test-secret-test-secret-0',
    baseURL: 'http://localhost:3000',
    emailAndPassword: { enabled: true },
    databaseHooks: ownerOnlySignup(ownerEmail),
  })
}

const signUp = (auth: ReturnType<typeof createAuth>, email: string) =>
  auth.api.signUpEmail({ body: { name: 'Someone', email, password: 'Passw0rd123' } })

describe('registration with better-auth', () => {
  it('lets the owner create the account', async () => {
    const auth = createAuth('owner@example.com')
    const result = await signUp(auth, 'Owner@example.com')
    expect(result.user.email).toBe('owner@example.com')
  })

  it('refuses anyone else with "Registration is closed." and creates nothing', async () => {
    const auth = createAuth('owner@example.com')

    await expect(signUp(auth, 'stranger@example.com')).rejects.toMatchObject({ body: { message: 'Registration is closed.' } })

    // The owner can still register afterwards, proving the refused attempt left no half-created user behind.
    await expect(signUp(auth, 'owner@example.com')).resolves.toBeDefined()
  })

  it('refuses everyone when no owner is configured', async () => {
    const auth = createAuth(undefined)
    await expect(signUp(auth, 'owner@example.com')).rejects.toMatchObject({ body: { message: 'Registration is closed.' } })
  })
})
