import * as http from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createGuardedLookup, type GuardedLookup } from './host-guard'
import { SslService } from './ssl.service'

// A real local server. The test lookup maps a fake public name to it, which is exactly what the guard must
// refuse in production, so the same server also proves the block.
let server: http.Server
let port: number
const hits: string[] = []

const toLocalhost: GuardedLookup = (_host, options, callback) =>
  options.all ? callback(null, [{ address: '127.0.0.1', family: 4 }]) : callback(null, '127.0.0.1', 4)

beforeAll(async () => {
  server = http.createServer((req, res) => {
    hits.push(req.url ?? '')
    switch (req.url) {
      case '/ok': return void res.writeHead(200).end('fine')
      case '/missing': return void res.writeHead(404).end()
      case '/redirect': return void res.writeHead(301, { location: '/ok' }).end()
      case '/chain-a': return void res.writeHead(302, { location: '/chain-b' }).end()
      case '/chain-b': return void res.writeHead(302, { location: '/ok' }).end()
      case '/loop': return void res.writeHead(302, { location: '/loop' }).end()
      case '/to-metadata': return void res.writeHead(302, { location: 'http://169.254.169.254/latest/meta-data/' }).end()
      case '/to-loopback': return void res.writeHead(302, { location: 'http://127.0.0.1:1/' }).end()
      case '/to-ftp': return void res.writeHead(302, { location: 'ftp://example.test/file' }).end()
      default: return void res.writeHead(200).end()
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  port = (server.address() as AddressInfo).port
})

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))

const site = (path: string) => `http://site.example.test:${port}${path}`

describe('SslService.checkHealth', () => {
  const service = new SslService(toLocalhost)

  it('reports a 200 answer as online, with the status and the time it took', async () => {
    const result = await service.checkHealth(site('/ok'))
    expect(result).toMatchObject({ url: site('/ok'), online: true, statusCode: 200 })
    expect(result.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('reports an error status as offline with that status', async () => {
    expect(await service.checkHealth(site('/missing'))).toMatchObject({ online: false, statusCode: 404 })
  })

  it('follows redirects, also several in a row, and reports the final answer', async () => {
    expect(await service.checkHealth(site('/redirect'))).toMatchObject({ online: true, statusCode: 200 })
    expect(await service.checkHealth(site('/chain-a'))).toMatchObject({ online: true, statusCode: 200 })
  })

  it('gives up on a redirect loop', async () => {
    expect(await service.checkHealth(site('/loop'))).toMatchObject({ online: false, error: 'Too many redirects' })
  })

  it('does not follow a redirect to a private address, such as cloud metadata or loopback', async () => {
    for (const path of ['/to-metadata', '/to-loopback']) {
      const result = await service.checkHealth(site(path))
      expect(result).toMatchObject({ online: false, error: 'Private network targets are not permitted' })
    }
  })

  it('does not follow a redirect to another scheme', async () => {
    expect(await service.checkHealth(site('/to-ftp'))).toMatchObject({ online: false, error: 'Only http and https addresses are checked' })
  })

  it('refuses literal private addresses and localhost without opening a connection', async () => {
    hits.length = 0
    for (const url of [`http://127.0.0.1:${port}/ok`, `http://[::1]:${port}/ok`, `http://localhost:${port}/ok`, `http://[::ffff:7f00:1]:${port}/ok`]) {
      expect(await service.checkHealth(url)).toMatchObject({ online: false, error: 'Private network targets are not permitted' })
    }
    expect(hits).toEqual([])
  })

  it('reports a connection that cannot be made as offline with the reason', async () => {
    const result = await new SslService((_h, options, cb) => (options.all ? cb(null, [{ address: '203.0.113.9', family: 4 }]) : cb(null, '203.0.113.9', 4))).checkHealth('http://site.example.test:9/')
    expect(result.online).toBe(false)
    expect(result.error).toBeTruthy()
  }, 15_000)
})

describe('SslService with the production guard', () => {
  it('refuses a name that resolves to a private address, so DNS cannot be used to reach the local network', async () => {
    hits.length = 0
    const service = new SslService(createGuardedLookup(toLocalhost))
    expect(await service.checkHealth(site('/ok'))).toMatchObject({ online: false, error: 'Private network targets are not permitted' })
    expect(hits).toEqual([])
  })

  it('refuses private targets for the SSL check too', async () => {
    const service = new SslService(createGuardedLookup(toLocalhost))
    expect(await service.check('127.0.0.1')).toMatchObject({ status: 'ERROR', error: 'Private network targets are not permitted' })
    expect(await service.check('site.example.test')).toMatchObject({ status: 'ERROR', error: 'Private network targets are not permitted' })
  })
})
