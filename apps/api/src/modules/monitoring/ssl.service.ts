import { Injectable, Logger } from '@nestjs/common'
import * as tls from 'tls'

export interface SslStatus {
  hostname: string
  valid: boolean
  daysRemaining: number
  expiresAt: string
  issuer: string
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'ERROR'
  error?: string
}

@Injectable()
export class SslService {
  private readonly logger = new Logger(SslService.name)

  async check(hostname: string): Promise<SslStatus> {
    return new Promise((resolve) => {
      const socket = tls.connect(
        { host: hostname, port: 443, servername: hostname, timeout: 8000 },
        () => {
          try {
            const cert = socket.getPeerCertificate()
            socket.destroy()

            if (!cert || !cert.valid_to) {
              return resolve({
                hostname,
                valid: false,
                daysRemaining: 0,
                expiresAt: '',
                issuer: '',
                status: 'ERROR',
                error: 'Could not read certificate',
              })
            }

            const expiresAt = new Date(cert.valid_to)
            const now = new Date()
            const daysRemaining = Math.floor(
              (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            )

            const issuer = String(cert.issuer?.O ?? cert.issuer?.CN ?? 'Unknown')

            let status: SslStatus['status']
            if (daysRemaining < 0) {
              status = 'EXPIRED'
            } else if (daysRemaining < 30) {
              status = 'EXPIRING_SOON'
            } else {
              status = 'VALID'
            }

            resolve({
              hostname,
              valid: daysRemaining >= 0,
              daysRemaining,
              expiresAt: expiresAt.toISOString(),
              issuer,
              status,
            })
          } catch (err: any) {
            socket.destroy()
            resolve({
              hostname,
              valid: false,
              daysRemaining: 0,
              expiresAt: '',
              issuer: '',
              status: 'ERROR',
              error: err.message,
            })
          }
        },
      )

      socket.on('error', (err) => {
        resolve({
          hostname,
          valid: false,
          daysRemaining: 0,
          expiresAt: '',
          issuer: '',
          status: 'ERROR',
          error: err.message,
        })
      })

      socket.on('timeout', () => {
        socket.destroy()
        resolve({
          hostname,
          valid: false,
          daysRemaining: 0,
          expiresAt: '',
          issuer: '',
          status: 'ERROR',
          error: 'Connection timed out',
        })
      })
    })
  }

  async checkHealth(url: string): Promise<{ url: string; online: boolean; statusCode?: number; latencyMs?: number; error?: string }> {
    const start = Date.now()
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      return {
        url,
        online: res.ok,
        statusCode: res.status,
        latencyMs: Date.now() - start,
      }
    } catch (err: any) {
      return {
        url,
        online: false,
        latencyMs: Date.now() - start,
        error: err.message,
      }
    }
  }
}
