import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_SCRIPT, THEME_STORAGE_KEY } from './theme-script'

function runScript() {
  new Function(THEME_SCRIPT)()
}

function store(state: Record<string, unknown>) {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ state, version: 0 }))
}

function prefersDark(value: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('dark') ? value : !value, media: query }))
}

describe('theme script', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.removeAttribute('data-accent')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('applies a saved light theme and accent before React runs', () => {
    store({ theme: 'light', accentColor: 'rose' })
    runScript()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.documentElement.getAttribute('data-accent')).toBe('rose')
  })

  it('follows the system preference when the theme is system', () => {
    store({ theme: 'system', accentColor: 'violet' })
    prefersDark(false)
    runScript()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    prefersDark(true)
    runScript()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('leaves the defaults alone when nothing is saved', () => {
    runScript()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false)
  })

  it('ignores damaged storage instead of throwing and breaking the page', () => {
    localStorage.setItem(THEME_STORAGE_KEY, '{not json')
    expect(runScript).not.toThrow()
    localStorage.setItem(THEME_STORAGE_KEY, '"a string"')
    expect(runScript).not.toThrow()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('accepts only known themes and plain accent names, so storage cannot inject attribute values', () => {
    store({ theme: 'javascript:alert(1)', accentColor: '"><script>' })
    runScript()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false)
  })
})
