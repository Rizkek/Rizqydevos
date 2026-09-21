import { Injectable, Inject } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class CacheService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key)
    if (!value) return null
    return JSON.parse(value) as T
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value))
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async invalidatePattern(pattern: string): Promise<void> {
    let cursor = '0'
    const keysToDelete: string[] = []

    do {
      const [newCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = newCursor
      keysToDelete.push(...keys)
    } while (cursor !== '0')

    if (keysToDelete.length > 0) {
      // Delete in batches of 100 to avoid blocking
      for (let i = 0; i < keysToDelete.length; i += 100) {
        await this.redis.del(...keysToDelete.slice(i, i + 100))
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key)
    return result === 1
  }
}
