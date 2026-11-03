import { createHash } from 'node:crypto'

export interface CachedSession {
  user: { id: string }
  session: { id: string; createdAt?: string }
}

interface Entry {
  value: CachedSession
  expiresAt: number
}

// Remembers a verified session for a short time, so that a burst of API calls (a page loads several lists)
// asks the web app once instead of once per call. Only successful verifications are stored.
// Trade-off: a session revoked on sign-out still works here for up to ttlMs.
// The key is a hash of the cookie header, so raw session tokens are never kept in memory.
export class SessionCache {
  private readonly entries = new Map<string, Entry>()

  constructor(
    private readonly ttlMs = 30_000,
    private readonly maxEntries = 50,
    private readonly now: () => number = Date.now,
  ) {}

  private keyFor(cookieHeader: string): string {
    return createHash('sha256').update(cookieHeader).digest('hex')
  }

  get(cookieHeader: string): CachedSession | undefined {
    const key = this.keyFor(cookieHeader)
    const entry = this.entries.get(key)
    if (!entry) return undefined
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key)
      return undefined
    }
    return entry.value
  }

  set(cookieHeader: string, value: CachedSession): void {
    // Maps iterate in insertion order, so the first key is the oldest entry.
    if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value
      if (oldest !== undefined) this.entries.delete(oldest)
    }
    this.entries.set(this.keyFor(cookieHeader), { value, expiresAt: this.now() + this.ttlMs })
  }

  get size(): number {
    return this.entries.size
  }
}
