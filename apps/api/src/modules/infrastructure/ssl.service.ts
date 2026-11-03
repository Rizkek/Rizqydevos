import { Inject, Injectable } from '@nestjs/common'
import * as http from 'node:http'
import * as https from 'node:https'
import * as tls from 'node:tls'
import { BLOCKED_MESSAGE, createGuardedLookup, isBlockedHostname, type GuardedLookup } from './host-guard'

export interface SslStatus {
  hostname: string
  valid: boolean
  daysRemaining: number
  expiresAt: string
  issuer: string
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'ERROR'
  error?: string
}

export interface HealthStatus {
  url: string
  online: boolean
  statusCode?: number
  latencyMs?: number
  error?: string
}

// Provided in InfrastructureModule; tests pass a lookup that maps names to a local server.
export const HOST_LOOKUP = Symbol('HOST_LOOKUP')

const HEALTH_TIMEOUT_MS = 5000
const SSL_TIMEOUT_MS = 8000
const MAX_REDIRECTS = 3
const DAY_MS = 24 * 60 * 60 * 1000
const EXPIRING_SOON_DAYS = 30

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function failedSsl(hostname: string, error: string): SslStatus {
  return { hostname, valid: false, daysRemaining: 0, expiresAt: '', issuer: '', status: 'ERROR', error }
}

@Injectable()
export class SslService {
  constructor(@Inject(HOST_LOOKUP) private readonly lookup: GuardedLookup = createGuardedLookup()) {}

  check(hostname: string): Promise<SslStatus> {
    if (isBlockedHostname(hostname)) return Promise.resolve(failedSsl(hostname, BLOCKED_MESSAGE))

    return new Promise((resolve) => {
      const socket = tls.connect(
        { host: hostname, port: 443, servername: hostname, timeout: SSL_TIMEOUT_MS, lookup: this.lookup },
        () => {
          try {
            const cert = socket.getPeerCertificate()
            socket.destroy()

            if (!cert || !cert.valid_to) return resolve(failedSsl(hostname, 'Could not read certificate'))

            const expiresAt = new Date(cert.valid_to)
            const daysRemaining = Math.floor((expiresAt.getTime() - Date.now()) / DAY_MS)
            const status: SslStatus['status'] = daysRemaining < 0 ? 'EXPIRED' : daysRemaining < EXPIRING_SOON_DAYS ? 'EXPIRING_SOON' : 'VALID'

            resolve({
              hostname,
              valid: daysRemaining >= 0,
              daysRemaining,
              expiresAt: expiresAt.toISOString(),
              issuer: String(cert.issuer?.O ?? cert.issuer?.CN ?? 'Unknown'),
              status,
            })
          } catch (error) {
            socket.destroy()
            resolve(failedSsl(hostname, messageOf(error)))
          }
        },
      )

      socket.on('error', (error) => resolve(failedSsl(hostname, messageOf(error))))
      socket.on('timeout', () => {
        socket.destroy()
        resolve(failedSsl(hostname, 'Connection timed out'))
      })
    })
  }

  // Follows up to MAX_REDIRECTS redirects itself, so that every hop is checked like the first request.
  async checkHealth(url: string): Promise<HealthStatus> {
    const start = Date.now()
    try {
      let current = new URL(url)
      for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        if (current.protocol !== 'http:' && current.protocol !== 'https:') throw new Error('Only http and https addresses are checked')
        if (isBlockedHostname(current.hostname)) throw new Error(BLOCKED_MESSAGE)

        const response = await this.requestOnce(current)
        if (response.statusCode >= 300 && response.statusCode < 400 && response.location) {
          current = new URL(response.location, current)
          continue
        }
        return { url, online: response.statusCode >= 200 && response.statusCode < 300, statusCode: response.statusCode, latencyMs: Date.now() - start }
      }
      throw new Error('Too many redirects')
    } catch (error) {
      return { url, online: false, latencyMs: Date.now() - start, error: messageOf(error) }
    }
  }

  private requestOnce(url: URL): Promise<{ statusCode: number; location?: string }> {
    return new Promise((resolve, reject) => {
      const transport = url.protocol === 'https:' ? https : http
      const request = transport.request(
        url,
        {
          method: 'GET',
          lookup: this.lookup,
          signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
          headers: { 'user-agent': 'DevOS-uptime-check', accept: '*/*' },
        },
        (response) => {
          resolve({ statusCode: response.statusCode ?? 0, ...(response.headers.location && { location: response.headers.location }) })
          // Only the status matters; stop downloading the body.
          response.destroy()
        },
      )
      request.on('error', reject)
      request.end()
    })
  }
}
