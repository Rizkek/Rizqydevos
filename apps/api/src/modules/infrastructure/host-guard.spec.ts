import { describe, expect, it } from 'vitest'
import { createGuardedLookup, isBlockedHostname, isPrivateAddress, isValidHostname, type GuardedLookup } from './host-guard'

describe('isPrivateAddress', () => {
  it.each([
    '127.0.0.1', '127.255.255.254', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254',
    '0.0.0.0', '100.64.0.1', '198.18.0.1', '224.0.0.1', '255.255.255.255',
  ])('blocks IPv4 %s', (ip) => {
    expect(isPrivateAddress(ip)).toBe(true)
  })

  it.each(['8.8.8.8', '1.1.1.1', '172.15.255.255', '172.32.0.1', '93.184.216.34', '100.63.255.255'])('allows public IPv4 %s', (ip) => {
    expect(isPrivateAddress(ip)).toBe(false)
  })

  it.each([
    '::', '::1', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'fe80::1%eth0', 'ff02::1', '2001:db8::1', '2001:0:4136:e378:8000:63bf:3fff:fdd2',
    '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:10.0.0.1', '::ffff:169.254.169.254', '64:ff9b::7f00:1', '2002:7f00:1::1', '[::1]',
  ])('blocks IPv6 %s', (ip) => {
    expect(isPrivateAddress(ip)).toBe(true)
  })

  it.each(['2606:4700:4700::1111', '2001:4860:4860::8888', '::ffff:8.8.8.8', '64:ff9b::808:808'])('allows public IPv6 %s', (ip) => {
    expect(isPrivateAddress(ip)).toBe(false)
  })

  it('treats text that is not an address as private, so a parsing gap fails closed', () => {
    expect(isPrivateAddress('not-an-ip')).toBe(true)
    expect(isPrivateAddress('')).toBe(true)
  })
})

describe('isBlockedHostname', () => {
  it('blocks localhost names and literal private addresses, with or without brackets', () => {
    for (const name of ['localhost', 'LOCALHOST', 'app.localhost', 'localhost.', '127.0.0.1', '[::1]', '10.0.0.5', '[::ffff:7f00:1]']) {
      expect(isBlockedHostname(name)).toBe(true)
    }
  })

  it('does not block ordinary names, including ones that start with the letters fc or fd', () => {
    for (const name of ['example.com', 'fcc.gov', 'fdic.gov', 'fc.example.org', '8.8.8.8']) {
      expect(isBlockedHostname(name)).toBe(false)
    }
  })
})

describe('isValidHostname', () => {
  it('accepts domain names and address literals', () => {
    for (const name of ['example.com', 'a-b.example.co.uk', 'xn--bcher-kva.example', '1.2.3.4', '[2606:4700::1111]', 'example.com.']) {
      expect(isValidHostname(name)).toBe(true)
    }
  })

  it('rejects empty names, ports, paths, spaces, and over-long labels', () => {
    for (const name of ['', 'example.com:8080', 'example.com/path', 'exa mple.com', '-bad.example.com', `${'a'.repeat(64)}.com`, 'a'.repeat(254)]) {
      expect(isValidHostname(name)).toBe(false)
    }
  })
})

describe('createGuardedLookup', () => {
  const answer = (...addresses: Array<[string, 4 | 6]>): GuardedLookup => (_host, _options, callback) =>
    callback(null, addresses.map(([address, family]) => ({ address, family })), undefined)

  const run = (lookup: GuardedLookup, all: boolean) =>
    new Promise<{ error: NodeJS.ErrnoException | null; result: unknown }>((resolve) => {
      lookup('example.com', { all }, (error, result, family) => resolve({ error, result: all ? result : [result, family] }))
    })

  it('refuses a name that resolves to a private address', async () => {
    const { error } = await run(createGuardedLookup(answer(['10.0.0.8', 4])), true)
    expect(error).toMatchObject({ code: 'EBLOCKED', message: 'Private network targets are not permitted' })
  })

  it('refuses when any one of several answers is private (the connection could pick it)', async () => {
    const { error } = await run(createGuardedLookup(answer(['93.184.216.34', 4], ['127.0.0.1', 4])), true)
    expect(error?.code).toBe('EBLOCKED')
  })

  it('refuses a name that maps to a private address through IPv6', async () => {
    expect((await run(createGuardedLookup(answer(['::ffff:169.254.169.254', 6])), true)).error?.code).toBe('EBLOCKED')
  })

  it('passes public answers through in both lookup modes', async () => {
    const lookup = createGuardedLookup(answer(['93.184.216.34', 4], ['2606:2800:220:1::1', 6]))
    expect((await run(lookup, true)).result).toEqual([{ address: '93.184.216.34', family: 4 }, { address: '2606:2800:220:1::1', family: 6 }])
    expect((await run(lookup, false)).result).toEqual(['93.184.216.34', 4])
  })

  it('refuses an empty answer and passes resolver errors on', async () => {
    expect((await run(createGuardedLookup(answer()), true)).error?.code).toBe('EBLOCKED')
    const failing: GuardedLookup = (_host, _options, callback) => callback(Object.assign(new Error('not found'), { code: 'ENOTFOUND' }), '', undefined)
    expect((await run(createGuardedLookup(failing), true)).error?.code).toBe('ENOTFOUND')
  })
})
