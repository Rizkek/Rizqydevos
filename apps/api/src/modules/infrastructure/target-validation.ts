import { BadRequestException } from '@nestjs/common'
import { BLOCKED_MESSAGE, isBlockedHostname, isValidHostname } from './host-guard'

// Max 20 hosts per batch to prevent resource exhaustion.
export const MAX_BATCH = 20
const MAX_URL_LENGTH = 2048

// First line of defence: rejects malformed names and literal private addresses with a 400. Names that
// resolve to private addresses are refused later, when the connection is opened (see host-guard.ts).
export function validateHostname(hostname: string): void {
  if (!isValidHostname(hostname)) throw new BadRequestException('Invalid hostname')
  if (isBlockedHostname(hostname)) throw new BadRequestException(BLOCKED_MESSAGE)
}

export function validateUrl(rawUrl: string): void {
  if (rawUrl.length > MAX_URL_LENGTH) throw new BadRequestException('Invalid URL')
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new BadRequestException('Invalid URL')
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new BadRequestException('Only http/https URLs are permitted')
  validateHostname(parsed.hostname)
}
