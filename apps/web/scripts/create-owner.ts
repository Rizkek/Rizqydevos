// Creates the single owner account. Registration is closed in the UI and by signup-policy.ts,
// so this is the only way to make the first user. Run it yourself; it reads secrets from your environment:
//   OWNER_EMAIL=you@example.com OWNER_PASSWORD='...' bun run --cwd apps/web create-owner
// DATABASE_URL, BETTER_AUTH_SECRET and BETTER_AUTH_URL must be set as they are for the app.
import { auth } from '../src/lib/auth'

const email = process.env.OWNER_EMAIL
const password = process.env.OWNER_PASSWORD
const name = process.env.OWNER_NAME || 'Owner'

if (!email || !password) {
  console.error('Set OWNER_EMAIL and OWNER_PASSWORD (and optionally OWNER_NAME) before running this script.')
  process.exit(1)
}

try {
  const { user } = await auth.api.signUpEmail({ body: { name, email, password } })
  console.log(`Owner account created for ${user.email}.`)
  process.exit(0)
} catch (error) {
  // Never print the password; the library's message is enough (e.g. "User already exists").
  console.error('Could not create the owner account:', error instanceof Error ? error.message : error)
  process.exit(1)
}
