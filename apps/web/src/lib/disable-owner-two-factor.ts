// The part of Better Auth that the recovery script needs, so the logic can be tested without a database.
export interface DisableContext {
  adapter: {
    deleteMany: (input: { model: string; where: { field: string; value: string }[] }) => Promise<number>
  }
  internalAdapter: {
    findUserByEmail: (email: string) => Promise<{ user: { id: string; email: string } } | null>
    updateUser: (userId: string, data: { twoFactorEnabled: boolean }) => Promise<unknown>
    deleteUserSessions: (userId: string) => Promise<void>
  }
}

export class DisableError extends Error {}

// Turns two-factor sign-in off for the account and signs every device out. For the case where both the
// authenticator app and the backup codes are lost. It needs access to the database, so it is the owner's recovery path.
export async function disableOwnerTwoFactor(ctx: DisableContext, email: string): Promise<string> {
  const found = await ctx.internalAdapter.findUserByEmail(email.trim().toLowerCase())
  if (!found) throw new DisableError('No account has this email address.')

  await ctx.adapter.deleteMany({ model: 'twoFactor', where: [{ field: 'userId', value: found.user.id }] })
  await ctx.internalAdapter.updateUser(found.user.id, { twoFactorEnabled: false })
  await ctx.internalAdapter.deleteUserSessions(found.user.id)
  return found.user.email
}
