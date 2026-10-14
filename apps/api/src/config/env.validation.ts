import { z } from 'zod'

export function isValidEncryptionKey(value: string): boolean {
  if (Buffer.byteLength(value, 'utf8') === 32) return true

  if (/^[0-9a-fA-F]{64}$/.test(value)) return true

  if (/^[A-Za-z0-9+/]{43}={0,1}$/.test(value)) {
    try {
      const decoded = Buffer.from(value, 'base64')
      return decoded.length === 32 && decoded.toString('base64') === value
    } catch {
      return false
    }
  }

  return false
}

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  // Proxies between the internet and this process. 0 when exposed directly; otherwise
  // rate limiting would see every user as the proxy's IP.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  APP_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Storage (Cloudflare R2)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),

  // AI Providers
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Encryption (for secrets manager)
  ENCRYPTION_KEY: z.string().refine(
    isValidEncryptionKey,
    'must be 32 UTF-8 bytes, 64 hexadecimal characters, or a base64-encoded 32-byte key',
  ).optional(),
}).refine(
  (data) => {
    if (data.NODE_ENV === 'production' && !data.ENCRYPTION_KEY) {
      return false
    }
    return true
  },
  {
    message: 'ENCRYPTION_KEY is required in production',
    path: ['ENCRYPTION_KEY'],
  }
)

export type Env = z.infer<typeof envSchema>

export function envValidation(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config)

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')

    throw new Error(
      `\n❌ Invalid environment variables:\n${missing}\n\n` +
      `Please check your .env file against .env.example\n`,
    )
  }

  return result.data
}
