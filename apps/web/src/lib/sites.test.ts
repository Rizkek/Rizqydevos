import { describe, expect, it } from 'vitest'
import { MAX_SITES, describeHealth, describeSsl, sitesFromProjects } from './sites'

describe('sitesFromProjects', () => {
  it('keeps only projects with a usable deploy URL', () => {
    const sites = sitesFromProjects([
      { id: '1', name: 'Blog', deployUrl: 'https://blog.example.com' },
      { id: '2', name: 'No URL' },
      { id: '3', name: 'Empty', deployUrl: '   ' },
      { id: '4', name: 'Not http', deployUrl: 'ftp://files.example.com' },
    ])
    expect(sites.map((s) => s.projectId)).toEqual(['1'])
    expect(sites[0]).toMatchObject({ hostname: 'blog.example.com', https: true })
  })

  it('assumes https when the scheme was left out', () => {
    expect(sitesFromProjects([{ id: '1', name: 'App', deployUrl: 'app.example.com' }])[0]).toMatchObject({
      url: 'https://app.example.com/',
      https: true,
    })
  })

  it('marks plain http sites so the SSL check can be skipped', () => {
    expect(sitesFromProjects([{ id: '1', name: 'Old', deployUrl: 'http://old.example.com' }])[0]?.https).toBe(false)
  })

  it('drops duplicates and caps the list at the API batch limit', () => {
    const many = Array.from({ length: MAX_SITES + 5 }, (_, i) => ({ id: String(i), name: `P${i}`, deployUrl: `https://p${i}.example.com` }))
    const withDuplicate = [{ id: 'dup', name: 'Dup', deployUrl: 'https://p0.example.com' }, ...many]
    const sites = sitesFromProjects(withDuplicate)
    expect(sites).toHaveLength(MAX_SITES)
    expect(sites.filter((s) => s.hostname === 'p0.example.com')).toHaveLength(1)
  })
})

describe('status text', () => {
  it('describes health without relying on colour', () => {
    expect(describeHealth({ url: 'u', online: true, latencyMs: 120 })).toBe('Online, 120 ms')
    expect(describeHealth({ url: 'u', online: false, statusCode: 503 })).toBe('Offline, HTTP 503')
    expect(describeHealth({ url: 'u', online: false })).toBe('Offline')
    expect(describeHealth(undefined)).toBe('Not checked')
  })

  it('describes each SSL status', () => {
    expect(describeSsl({ hostname: 'h', status: 'VALID', daysRemaining: 60 })).toBe('SSL valid, 60 days left')
    expect(describeSsl({ hostname: 'h', status: 'EXPIRING_SOON', daysRemaining: 9 })).toBe('SSL expires in 9 days')
    expect(describeSsl({ hostname: 'h', status: 'EXPIRED', daysRemaining: -1 })).toBe('SSL expired')
    expect(describeSsl({ hostname: 'h', status: 'ERROR', daysRemaining: 0 })).toBe('SSL check failed')
  })
})
