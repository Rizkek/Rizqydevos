import * as dns from 'node:dns'
import * as net from 'node:net'

// Outgoing checks (uptime, SSL) take hosts the owner typed, so they must never reach the server's own
// network. The check happens where it cannot be bypassed: in the lookup used to open the connection.
export const BLOCKED_MESSAGE = 'Private network targets are not permitted'

type V4Block = readonly [base: string, prefixBits: number]

// Loopback, private, link-local (cloud metadata), CGNAT, benchmarking, documentation, multicast, reserved.
const V4_BLOCKS: readonly V4Block[] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
]

function v4ToNumber(octets: number[]): number {
  return (((octets[0] ?? 0) << 24) | ((octets[1] ?? 0) << 16) | ((octets[2] ?? 0) << 8) | (octets[3] ?? 0)) >>> 0
}

function isPrivateV4(octets: number[]): boolean {
  const value = v4ToNumber(octets)
  return V4_BLOCKS.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
    return (value & mask) === (v4ToNumber(base.split('.').map(Number)) & mask)
  })
}

// Eight 16-bit groups, or null when the text is not a valid IPv6 address.
function parseV6(raw: string): number[] | null {
  let ip = raw.split('%')[0] ?? ''
  const embedded = ip.match(/^(.*:)(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (embedded) {
    const [, prefix = '', a = '', b = '', c = '', d = ''] = embedded
    const [o0 = 0, o1 = 0, o2 = 0, o3 = 0] = [a, b, c, d].map(Number)
    if ([o0, o1, o2, o3].some((octet) => octet > 255)) return null
    ip = `${prefix}${((o0 << 8) | o1).toString(16)}:${((o2 << 8) | o3).toString(16)}`
  }

  const halves = ip.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const fill = 8 - head.length - tail.length
  if (halves.length === 1 ? head.length !== 8 : fill < 1) return null

  const groups = [...head, ...Array<string>(halves.length === 2 ? fill : 0).fill('0'), ...tail]
  const numbers = groups.map((group) => (/^[0-9a-fA-F]{1,4}$/.test(group) ? parseInt(group, 16) : NaN))
  return numbers.some(Number.isNaN) ? null : numbers
}

function embeddedV4(high: number, low: number): number[] {
  return [(high >> 8) & 255, high & 255, (low >> 8) & 255, low & 255]
}

// True for any address that is not a normal public internet address. Unparsable input counts as private.
export function isPrivateAddress(address: string): boolean {
  const bare = address.replace(/^\[|\]$/g, '')
  const version = net.isIP(bare)
  if (version === 4) return isPrivateV4(bare.split('.').map(Number))
  if (version !== 6) return true

  const g = parseV6(bare)
  if (!g) return true
  const [g0 = 0, g1 = 0, g2 = 0, g3 = 0, g4 = 0, g5 = 0, g6 = 0, g7 = 0] = g

  if (g.every((group) => group === 0)) return true // ::
  if (g.slice(0, 7).every((group) => group === 0) && g7 === 1) return true // ::1
  if ((g0 & 0xfe00) === 0xfc00) return true // fc00::/7 unique local
  if ((g0 & 0xffc0) === 0xfe80) return true // fe80::/10 link-local
  if ((g0 & 0xff00) === 0xff00) return true // ff00::/8 multicast
  if (g0 === 0x2001 && g1 === 0x0db8) return true // documentation
  if (g0 === 0x2001 && g1 === 0) return true // Teredo tunnelling
  // IPv4 carried inside IPv6: the IPv4 part decides.
  if (g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0xffff) return isPrivateV4(embeddedV4(g6, g7)) // ::ffff:a.b.c.d
  if (g0 === 0x64 && g1 === 0xff9b && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0) return isPrivateV4(embeddedV4(g6, g7)) // NAT64
  if (g0 === 0x2002) return isPrivateV4(embeddedV4(g1, g2)) // 6to4
  return false
}

// Checked before any connection: literal addresses never go through DNS, so the lookup guard cannot see them.
export function isBlockedHostname(hostname: string): boolean {
  const name = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '')
  if (net.isIP(name)) return isPrivateAddress(name)
  return name === 'localhost' || name.endsWith('.localhost')
}

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i

export function isValidHostname(hostname: string): boolean {
  const name = hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '')
  if (!name || name.length > 253) return false
  if (net.isIP(name)) return true
  return name.split('.').every((label) => LABEL.test(label))
}

export type GuardedLookup = net.LookupFunction

// Resolves like dns.lookup, but refuses to connect when any resolved address is private. Because it runs at
// connect time on the same answer the socket will use, DNS rebinding between a check and a connection is not possible.
export function createGuardedLookup(resolve: GuardedLookup = dns.lookup as unknown as GuardedLookup): GuardedLookup {
  return (hostname, options, callback) => {
    resolve(hostname, { ...options, all: true }, (error, result) => {
      if (error) return callback(error, '', undefined)
      const addresses = Array.isArray(result) ? result : []
      const [first] = addresses
      if (!first || addresses.some((entry) => isPrivateAddress(entry.address))) {
        return callback(Object.assign(new Error(BLOCKED_MESSAGE), { code: 'EBLOCKED' }) as NodeJS.ErrnoException, '', undefined)
      }
      if (options.all) return callback(null, addresses)
      callback(null, first.address, first.family)
    })
  }
}
