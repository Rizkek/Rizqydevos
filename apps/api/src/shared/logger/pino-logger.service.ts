import { ConsoleLogger, Injectable, Scope } from '@nestjs/common'
import pino from 'pino'

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'res.headers["set-cookie"]',
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
    ],
    censor: '[REDACTED]',
  },
})

@Injectable({ scope: Scope.TRANSIENT })
export class PinoLoggerService extends ConsoleLogger {
  override log(message: any, ...optionalParams: any[]) {
    pinoLogger.info({ context: this.context, ...this.parseParams(optionalParams) }, message)
  }

  override error(message: any, ...optionalParams: any[]) {
    pinoLogger.error({ context: this.context, ...this.parseParams(optionalParams) }, message)
  }

  override warn(message: any, ...optionalParams: any[]) {
    pinoLogger.warn({ context: this.context, ...this.parseParams(optionalParams) }, message)
  }

  override debug(message: any, ...optionalParams: any[]) {
    pinoLogger.debug({ context: this.context, ...this.parseParams(optionalParams) }, message)
  }

  override verbose(message: any, ...optionalParams: any[]) {
    pinoLogger.trace({ context: this.context, ...this.parseParams(optionalParams) }, message)
  }

  private parseParams(params: any[]) {
    if (params.length === 0) return {}
    if (params.length === 1 && typeof params[0] === 'object') return params[0]
    return { data: params }
  }
}