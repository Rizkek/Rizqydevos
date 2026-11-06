import { describe, expect, it, vi } from 'vitest'
import { ResetError, resetOwnerPassword, type ResetContext } from './reset-owner-password'

function makeContext(user: { id: string; email: string } | null = { id: 'u1', email: 'owner@example.com' }) {
  const ctx = {
    password: { hash: vi.fn(async (password: string) => `hashed:${password.length}`) },
    internalAdapter: {
      findUserByEmail: vi.fn(async () => (user ? { user } : null)),
      updatePassword: vi.fn(async () => undefined),
      deleteUserSessions: vi.fn(async () => undefined),
    },
  }
  return ctx as typeof ctx & ResetContext
}

describe('resetOwnerPassword', () => {
  it('stores a hash, never the password, and signs every device out', async () => {
    const ctx = makeContext()
    await expect(resetOwnerPassword(ctx, 'Owner@Example.com ', 'a-new-password')).resolves.toBe('owner@example.com')

    expect(ctx.internalAdapter.findUserByEmail).toHaveBeenCalledWith('owner@example.com')
    expect(ctx.internalAdapter.updatePassword).toHaveBeenCalledWith('u1', 'hashed:14')
    expect(JSON.stringify(ctx.internalAdapter.updatePassword.mock.calls)).not.toContain('a-new-password')
    expect(ctx.internalAdapter.deleteUserSessions).toHaveBeenCalledWith('u1')
  })

  it('refuses a password outside the allowed length before touching the database', async () => {
    const ctx = makeContext()
    await expect(resetOwnerPassword(ctx, 'owner@example.com', 'short')).rejects.toBeInstanceOf(ResetError)
    await expect(resetOwnerPassword(ctx, 'owner@example.com', 'x'.repeat(129))).rejects.toBeInstanceOf(ResetError)
    expect(ctx.internalAdapter.findUserByEmail).not.toHaveBeenCalled()
  })

  it('does not create an account when the address is unknown', async () => {
    const ctx = makeContext(null)
    await expect(resetOwnerPassword(ctx, 'someone@example.com', 'a-new-password')).rejects.toThrow(/No account has this email/)
    expect(ctx.internalAdapter.updatePassword).not.toHaveBeenCalled()
    expect(ctx.internalAdapter.deleteUserSessions).not.toHaveBeenCalled()
  })

  it('keeps the old sessions when the password could not be saved', async () => {
    const ctx = makeContext()
    ctx.internalAdapter.updatePassword.mockRejectedValue(new Error('db down'))
    await expect(resetOwnerPassword(ctx, 'owner@example.com', 'a-new-password')).rejects.toThrow('db down')
    expect(ctx.internalAdapter.deleteUserSessions).not.toHaveBeenCalled()
  })
})
