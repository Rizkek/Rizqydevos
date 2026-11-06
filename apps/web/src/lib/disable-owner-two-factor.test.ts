import { describe, expect, it, vi } from 'vitest'
import { DisableError, disableOwnerTwoFactor, type DisableContext } from './disable-owner-two-factor'

function context(found: { id: string; email: string } | null = { id: 'u1', email: 'owner@example.com' }) {
  const calls: string[] = []
  const ctx: DisableContext = {
    adapter: { deleteMany: vi.fn(async () => { calls.push('delete twoFactor'); return 1 }) },
    internalAdapter: {
      findUserByEmail: vi.fn(async () => (found ? { user: found } : null)),
      updateUser: vi.fn(async () => { calls.push('update user') }),
      deleteUserSessions: vi.fn(async () => { calls.push('sign out') }),
    },
  }
  return { ctx, calls }
}

describe('disableOwnerTwoFactor', () => {
  it('removes the secret, clears the flag, and signs every device out, in that order', async () => {
    const { ctx, calls } = context()
    await expect(disableOwnerTwoFactor(ctx, ' Owner@Example.com ')).resolves.toBe('owner@example.com')
    expect(ctx.internalAdapter.findUserByEmail).toHaveBeenCalledWith('owner@example.com')
    expect(ctx.adapter.deleteMany).toHaveBeenCalledWith({ model: 'twoFactor', where: [{ field: 'userId', value: 'u1' }] })
    expect(ctx.internalAdapter.updateUser).toHaveBeenCalledWith('u1', { twoFactorEnabled: false })
    expect(calls).toEqual(['delete twoFactor', 'update user', 'sign out'])
  })

  it('changes nothing when no account has the address', async () => {
    const { ctx } = context(null)
    await expect(disableOwnerTwoFactor(ctx, 'nobody@example.com')).rejects.toBeInstanceOf(DisableError)
    expect(ctx.adapter.deleteMany).not.toHaveBeenCalled()
    expect(ctx.internalAdapter.deleteUserSessions).not.toHaveBeenCalled()
  })
})
