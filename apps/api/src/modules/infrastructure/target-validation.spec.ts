import { BadRequestException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import { validateHostname, validateUrl } from './target-validation'

describe('validateHostname', () => {
  it('accepts public names, including those the old pattern rejected', () => {
    for (const name of ['example.com', 'fcc.gov', 'fdic.gov', '8.8.8.8']) expect(() => validateHostname(name)).not.toThrow()
  })

  it('rejects private literals and localhost with a 400', () => {
    for (const name of ['localhost', '127.0.0.1', '10.0.0.1', '192.168.0.10', '169.254.169.254', '[::1]', '[::ffff:127.0.0.1]', '[fd00::1]']) {
      expect(() => validateHostname(name)).toThrow(BadRequestException)
    }
  })

  it('rejects names with a port, a path, or spaces', () => {
    for (const name of ['', 'example.com:8080', 'example.com/x', 'a b.com']) expect(() => validateHostname(name)).toThrow(BadRequestException)
  })
})

describe('validateUrl', () => {
  it('accepts http and https URLs of public hosts', () => {
    for (const url of ['https://example.com', 'http://example.com:8080/path?q=1', 'https://fcc.gov/']) expect(() => validateUrl(url)).not.toThrow()
  })

  it('rejects other schemes, bad URLs, and over-long URLs', () => {
    for (const url of ['ftp://example.com', 'file:///etc/passwd', 'javascript:alert(1)', 'not a url', `https://example.com/${'a'.repeat(2100)}`]) {
      expect(() => validateUrl(url)).toThrow(BadRequestException)
    }
  })

  it('rejects private hosts however they are written, because the URL parser normalises them first', () => {
    for (const url of ['http://127.0.0.1/', 'http://2130706433/', 'http://0x7f.1/', 'http://017700000001/', 'http://[::1]/', 'http://[::ffff:7f00:1]/', 'http://localhost/', 'http://169.254.169.254/latest/meta-data/']) {
      expect(() => validateUrl(url), url).toThrow(BadRequestException)
    }
  })
})
