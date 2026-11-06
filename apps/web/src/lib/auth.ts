import { betterAuth } from "better-auth"
import { twoFactor } from "better-auth/plugins"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { ownerOnlySignup } from "./signup-policy"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export const auth = betterAuth({
  databaseHooks: ownerOnlySignup(process.env.OWNER_EMAIL),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  // Authenticator-app codes (TOTP) plus one-time backup codes. There is no email provider, so the email OTP method is not configured.
  plugins: [twoFactor({ issuer: "DevOS" })],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      // No email provider is set up. The link carries a token, so it is only printed while developing;
      // in production, hosting logs would keep it. Use the reset-owner-password script there.
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Better Auth] Password reset link for ${user.email}: ${url}`)
      }
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    modelName: "user",
    fields: {
      image: "avatarUrl"
    },
    additionalFields: {
      timezone: {
        type: "string",
        required: false,
        defaultValue: "Asia/Jakarta"
      }
    }
  }
})
