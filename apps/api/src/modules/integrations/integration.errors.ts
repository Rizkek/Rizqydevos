import { HttpException, HttpStatus } from '@nestjs/common'
import { IntegrationProvider, PROVIDER_LABEL } from './integration-provider'

export type IntegrationErrorCode =
  | 'INTEGRATION_NOT_CONFIGURED'
  | 'INTEGRATION_DISABLED'
  | 'INTEGRATION_TOKEN_INVALID'
  | 'TOKEN_UNREADABLE'
  | 'TOKEN_REJECTED'
  | 'RATE_LIMITED'
  | 'UPSTREAM_UNAVAILABLE'

// 401 is reserved for the app session. Upstream failures must never reuse it,
// otherwise the client cannot tell an expired login from a rejected provider token.
export class IntegrationException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: IntegrationErrorCode,
    message: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(
      {
        statusCode: status,
        error: code,
        message,
        ...(retryAfterSeconds !== undefined && { retryAfter: retryAfterSeconds }),
      },
      status,
    )
  }
}

export interface UpstreamFailure {
  status?: number | undefined
  rateLimited?: boolean | undefined
  retryAfterSeconds?: number | undefined
  timedOut?: boolean | undefined
}

export const notConfigured = (provider: IntegrationProvider) =>
  new IntegrationException(
    HttpStatus.NOT_FOUND,
    'INTEGRATION_NOT_CONFIGURED',
    `${PROVIDER_LABEL[provider]} is not connected`,
  )

export const disabled = (provider: IntegrationProvider) =>
  new IntegrationException(
    HttpStatus.CONFLICT,
    'INTEGRATION_DISABLED',
    `${PROVIDER_LABEL[provider]} integration is disabled`,
  )

export const tokenUnreadable = (provider: IntegrationProvider) =>
  new IntegrationException(
    HttpStatus.CONFLICT,
    'TOKEN_UNREADABLE',
    `The stored ${PROVIDER_LABEL[provider]} token can no longer be read. Reconnect the integration.`,
  )

export function fromUpstream(provider: IntegrationProvider, failure: UpstreamFailure): IntegrationException {
  const name = PROVIDER_LABEL[provider]

  if (failure.rateLimited || failure.status === 429) {
    return new IntegrationException(
      HttpStatus.TOO_MANY_REQUESTS,
      'RATE_LIMITED',
      `${name} rate limit reached. Try again later.`,
      failure.retryAfterSeconds,
    )
  }

  if (failure.status === 401 || failure.status === 403) {
    return new IntegrationException(
      HttpStatus.FAILED_DEPENDENCY,
      'TOKEN_REJECTED',
      `${name} rejected the token or it lacks the required permission.`,
    )
  }

  return new IntegrationException(
    failure.timedOut ? HttpStatus.GATEWAY_TIMEOUT : HttpStatus.BAD_GATEWAY,
    'UPSTREAM_UNAVAILABLE',
    `${name} is unavailable. Try again later.`,
  )
}
