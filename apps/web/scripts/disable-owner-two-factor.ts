// Turns two-factor sign-in off for the owner and signs out every device. Use it only when both the authenticator app
// and the backup codes are lost: turn it on again from Settings afterwards.
// Run it yourself; it does not print secrets:
//   OWNER_EMAIL=you@example.com bun run --cwd apps/web disable-owner-two-factor
// DATABASE_URL, BETTER_AUTH_SECRET and BETTER_AUTH_URL must be set as they are for the app.
import { auth } from '../src/lib/auth'
import { DisableError, disableOwnerTwoFactor } from '../src/lib/disable-owner-two-factor'

const email = process.env.OWNER_EMAIL

if (!email) {
  console.error('Set OWNER_EMAIL before running this script.')
  process.exit(1)
}

try {
  const ctx = await auth.$context
  const account = await disableOwnerTwoFactor(ctx, email)
  console.log(`Two-factor sign-in is off for ${account}. All devices were signed out.`)
  process.exit(0)
} catch (error) {
  console.error('Could not turn off two-factor sign-in:', error instanceof DisableError ? error.message : 'unexpected error, check DATABASE_URL and the app environment.')
  process.exit(1)
}
