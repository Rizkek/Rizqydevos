// Sets a new password for the owner account and signs out every device. Use it when the password is lost:
// no email is sent by this app, so the reset link on the sign-in page only works where the server log is visible.
// Run it yourself; it reads secrets from your environment and never prints the password:
//   OWNER_EMAIL=you@example.com NEW_PASSWORD='...' bun run --cwd apps/web reset-owner-password
// DATABASE_URL, BETTER_AUTH_SECRET and BETTER_AUTH_URL must be set as they are for the app.
import { auth } from '../src/lib/auth'
import { ResetError, resetOwnerPassword } from '../src/lib/reset-owner-password'

const email = process.env.OWNER_EMAIL
const newPassword = process.env.NEW_PASSWORD

if (!email || !newPassword) {
  console.error('Set OWNER_EMAIL and NEW_PASSWORD before running this script.')
  process.exit(1)
}

try {
  const ctx = await auth.$context
  const account = await resetOwnerPassword(ctx, email, newPassword)
  console.log(`Password changed for ${account}. All devices were signed out.`)
  process.exit(0)
} catch (error) {
  console.error('Could not reset the password:', error instanceof ResetError ? error.message : 'unexpected error, check DATABASE_URL and the app environment.')
  process.exit(1)
}
