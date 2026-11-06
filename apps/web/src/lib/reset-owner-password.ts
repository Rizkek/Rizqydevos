// The part of Better Auth that the reset script needs, so the logic can be tested without a database.
export interface ResetContext {
  password: { hash: (password: string) => Promise<string> }
  internalAdapter: {
    findUserByEmail: (email: string) => Promise<{ user: { id: string; email: string } } | null>
    updatePassword: (userId: string, hashedPassword: string) => Promise<void>
    deleteUserSessions: (userId: string) => Promise<void>
  }
}

// Must match minPasswordLength and maxPasswordLength in lib/auth.ts.
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128

export class ResetError extends Error {}

// Sets a new password for the account and signs every device out. Does not create accounts.
export async function resetOwnerPassword(ctx: ResetContext, email: string, newPassword: string): Promise<string> {
  if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
    throw new ResetError(`The new password must be ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters.`)
  }

  const found = await ctx.internalAdapter.findUserByEmail(email.trim().toLowerCase())
  if (!found) throw new ResetError('No account has this email address. Create it with create-owner first.')

  await ctx.internalAdapter.updatePassword(found.user.id, await ctx.password.hash(newPassword))
  await ctx.internalAdapter.deleteUserSessions(found.user.id)
  return found.user.email
}
