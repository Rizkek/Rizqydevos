import { describe, expect, it } from 'vitest'
import { IMPORT_LIMITS, keyFromUrl, parseCsv, parsePasswordCsv, summariseSkipped } from './vault-csv'

describe('parseCsv', () => {
  it('splits rows and fields, with either kind of line ending and a final line without one', () => {
    expect(parseCsv('a,b\r\nc,d\ne,f')).toEqual([['a', 'b'], ['c', 'd'], ['e', 'f']])
  })

  it('keeps commas, doubled quotes, and line breaks inside quoted fields', () => {
    expect(parseCsv('x,"a, ""b""\nc",y\n')).toEqual([['x', 'a, "b"\nc', 'y']])
  })

  it('removes a byte order mark and keeps empty fields', () => {
    expect(parseCsv('﻿a,,c\n')).toEqual([['a', '', 'c']])
  })

  it('returns nothing for empty input', () => {
    expect(parseCsv('')).toEqual([])
  })
})

describe('keyFromUrl', () => {
  it('uses the host without www and in lower case', () => {
    expect(keyFromUrl('https://www.GitHub.com/login?x=1')).toBe('github.com')
    expect(keyFromUrl('example.org/path')).toBe('example.org')
    expect(keyFromUrl('android://abc@com.example.app/')).toBe('com.example.app')
  })

  it('returns null for text that is not an address', () => {
    expect(keyFromUrl('not a url')).toBeNull()
  })
})

const CHROME = [
  'name,url,username,password,note',
  'github.com,https://github.com/login,ada,pw-one,work account',
  'github.com,https://github.com/login,bob,pw-two,',
  'Router,http://192.168.1.1/,admin,pw-three,',
].join('\n')

describe('parsePasswordCsv', () => {
  it('reads a Chrome or Edge export', () => {
    const result = parsePasswordCsv(CHROME)
    expect(result.format).toBe('recognised')
    expect(result.skipped).toEqual([])
    expect(result.items).toEqual([
      { name: 'github.com', key: 'github.com', username: 'ada', url: 'https://github.com/login', value: 'pw-one', description: 'work account' },
      { name: 'github.com', key: 'github.com', username: 'bob', url: 'https://github.com/login', value: 'pw-two' },
      { name: 'Router', key: '192.168.1.1', username: 'admin', url: 'http://192.168.1.1/', value: 'pw-three' },
    ])
  })

  it('reads a Bitwarden export and skips what is not a login', () => {
    const csv = [
      'folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp',
      'Work,0,login,GitHub,,,0,https://github.com,ada,pw-one,',
      ',0,note,Wi-Fi code,secret text,,0,,,,',
      ',0,card,Visa,,,0,,,,',
    ].join('\n')
    const result = parsePasswordCsv(csv)
    expect(result.items).toEqual([{ name: 'GitHub', key: 'github.com', username: 'ada', url: 'https://github.com', value: 'pw-one' }])
    expect(summariseSkipped(result.skipped)).toEqual([
      { reason: 'Not a login (note)', count: 1 },
      { reason: 'Not a login (card)', count: 1 },
    ])
  })

  it('reads a Firefox export, which has no name column', () => {
    const csv = 'url,username,password,httpRealm,formActionOrigin,guid\nhttps://example.com,ada,pw-one,,https://example.com,{abc}'
    expect(parsePasswordCsv(csv).items).toEqual([{ name: 'example.com', key: 'example.com', username: 'ada', url: 'https://example.com', value: 'pw-one' }])
  })

  it('skips rows without a password or without a site, and says why', () => {
    const csv = ['name,url,username,password', 'A,https://a.example,ada,', ',,ada,pw-x', 'B,https://b.example,ada,pw-b'].join('\n')
    const result = parsePasswordCsv(csv)
    expect(result.items.map((item) => item.key)).toEqual(['b.example'])
    expect(result.skipped).toEqual([{ row: 2, reason: 'No password' }, { row: 3, reason: 'No site or name' }])
  })

  it('falls back to the name when the address cannot be read', () => {
    const csv = 'name,url,username,password\nMy server,not a url,root,pw-x'
    expect(parsePasswordCsv(csv).items[0]).toMatchObject({ key: 'My server', name: 'My server' })
  })

  it('keeps spaces at the ends of a password and quotes inside it', () => {
    const csv = 'name,url,username,password\nA,https://a.example,ada,"  pw ""x""  "'
    expect(parsePasswordCsv(csv).items[0]?.value).toBe('  pw "x"  ')
  })

  it('refuses a password longer than the server accepts', () => {
    const csv = `name,url,username,password\nA,https://a.example,ada,${'x'.repeat(IMPORT_LIMITS.value + 1)}`
    const result = parsePasswordCsv(csv)
    expect(result.items).toEqual([])
    expect(result.skipped).toEqual([{ row: 2, reason: 'Password is too long' }])
  })

  it('does not recognise a file without a password column or without a site column', () => {
    expect(parsePasswordCsv('name,url,username\nA,https://a.example,ada').format).toBe('unrecognised')
    expect(parsePasswordCsv('username,password\nada,pw').format).toBe('unrecognised')
    expect(parsePasswordCsv('just some text').format).toBe('unrecognised')
  })

  it('reports an empty file', () => {
    expect(parsePasswordCsv('').format).toBe('empty')
    expect(parsePasswordCsv('\n\n').format).toBe('empty')
  })

  it('ignores blank lines between rows', () => {
    const csv = 'name,url,username,password\n\nA,https://a.example,ada,pw\n\n'
    expect(parsePasswordCsv(csv).items).toHaveLength(1)
  })
})
