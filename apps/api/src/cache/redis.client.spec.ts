import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import { attachRedisErrorLogging } from './redis.client'

function setup() {
  const client = new EventEmitter()
  const logger = { warn: vi.fn(), log: vi.fn() }
  attachRedisErrorLogging(client as unknown as Parameters<typeof attachRedisErrorLogging>[0], logger)
  return { client, logger }
}

describe('attachRedisErrorLogging', () => {
  it('handles error events, which would otherwise be thrown as unhandled', () => {
    const { client, logger } = setup()
    expect(() => client.emit('error', new Error('connect ECONNREFUSED 127.0.0.1:6379'))).not.toThrow()
    expect(logger.warn).toHaveBeenCalledWith('Redis error: connect ECONNREFUSED 127.0.0.1:6379')
  })

  it('logs a repeating problem once, not on every reconnect attempt', () => {
    const { client, logger } = setup()
    for (let i = 0; i < 20; i++) client.emit('error', new Error('connect ECONNREFUSED 127.0.0.1:6379'))
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })

  it('logs a different problem separately', () => {
    const { client, logger } = setup()
    client.emit('error', new Error('connect ECONNREFUSED'))
    client.emit('error', new Error('WRONGPASS invalid username-password pair'))
    expect(logger.warn).toHaveBeenCalledTimes(2)
  })

  it('says when the connection is back, and logs again if it fails again', () => {
    const { client, logger } = setup()
    client.emit('ready')
    expect(logger.log).not.toHaveBeenCalled()

    client.emit('error', new Error('connect ECONNREFUSED'))
    client.emit('ready')
    expect(logger.log).toHaveBeenCalledWith('Redis connection restored')

    client.emit('error', new Error('connect ECONNREFUSED'))
    expect(logger.warn).toHaveBeenCalledTimes(2)
  })
})
