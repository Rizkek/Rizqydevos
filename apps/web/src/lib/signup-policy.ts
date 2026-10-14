import { APIError } from 'better-auth/api'

// DevOS is single-user: public registration is a documented non-goal (docs/vision/05-non-goals.md).
// Any signed-in user can reach the Docker and secrets modules, so an open sign-up would hand them to strangers.
// Only the address in OWNER_EMAIL may create an account; when it is unset, nobody can.
export function isOwnerEmail(email: string, ownerEmail: string | undefined): boolean {
  const owner = ownerEmail?.trim().toLowerCase()
  return Boolean(owner) && email.trim().toLowerCase() === owner
}

// Hooked into better-auth's user creation, so it covers every path that creates a user
// (the sign-up endpoint, server-side calls, and any social provider added later).
export function ownerOnlySignup(ownerEmail: string | undefined) {
  return {
    user: {
      create: {
        before: async (user: { email: string }) => {
          if (!isOwnerEmail(user.email, ownerEmail)) {
            throw new APIError('FORBIDDEN', { message: 'Registration is closed.' })
          }
        },
      },
    },
  }
}
