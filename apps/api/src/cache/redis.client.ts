import { Logger } from '@nestjs/common'
import Redis from 'ioredis'

// Without an error listener ioredis prints "Unhandled error event" for every failed reconnect.
// Log each distinct problem once, and say when the connection comes back.
export function attachRedisErrorLogging(client: Pick<Redis, 'on'>, logger: Pick<Logger, 'warn' | 'log'> = new Logger('Redis')): void {
  let lastMessage = ''

  client.on('error', (error: Error) => {
    if (error.message === lastMessage) return
    lastMessage = error.message
    logger.warn(`Redis error: ${error.message}`)
  })

  client.on('ready', () => {
    if (lastMessage) logger.log('Redis connection restored')
    lastMessage = ''
  })
}

export function createRedisClient(url: string): Redis {
  const client = new Redis(url, {
    // Fail fast instead of queueing forever: the only caller is the readiness check.
    maxRetriesPerRequest: 1,
    commandTimeout: 2000,
    retryStrategy: (attempt) => Math.min(attempt * 500, 10_000),
  })
  attachRedisErrorLogging(client)
  return client
}
