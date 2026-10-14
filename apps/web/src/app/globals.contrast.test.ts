import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Reads the real stylesheet so a token edit cannot silently break WCAG contrast.
const css = readFileSync(join(__dirname, 'globals.css'), 'utf8')

type Hsl = [number, number, number]

function declarations(selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const out: Record<string, string> = {}
  const blocks = css.matchAll(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`, 'g'))
  for (const block of blocks) {
    for (const [, name, value] of block[1]!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[name!] = value!.trim()
  }
  return out
}

function parseHsl(value: string): Hsl | undefined {
  const match = /^hsl\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%\s*\)$/.exec(value)
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : undefined
}

function luminance([h, s, l]: Hsl): number {
  const sat = s / 100
  const light = l / 100
  const a = sat * Math.min(light, 1 - light)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    const c = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(8) + 0.0722 * channel(4)
}

function ratio(a: Hsl, b: Hsl): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

const accents = ['violet', 'emerald', 'cyan', 'amber', 'rose'] as const
const surfaces = ['--color-bg', '--color-bg-subtle', '--color-surface', '--color-surface-2', '--color-surface-3']
const solids = ['--color-accent', '--color-accent-hover', '--color-success', '--color-warning', '--color-danger', '--color-info']
const statusText = ['--color-accent', '--color-success', '--color-warning', '--color-danger', '--color-info']

// Cascade order matches the stylesheet: base, light theme, accent, light + accent.
function resolve(theme: 'dark' | 'light', accent: (typeof accents)[number]): Record<string, Hsl> {
  const layers = [declarations(':root')]
  if (theme === 'light') layers.push(declarations('[data-theme="light"]'))
  if (accent !== 'violet') {
    layers.push(declarations(`[data-accent="${accent}"]`))
    if (theme === 'light') layers.push(declarations(`[data-theme="light"][data-accent="${accent}"]`))
  }
  const merged = Object.assign({}, ...layers) as Record<string, string>
  const resolved: Record<string, Hsl> = {}
  for (const [name, value] of Object.entries(merged)) {
    const direct = parseHsl(value)
    if (direct) resolved[name] = direct
  }
  return resolved
}

const combos = (['dark', 'light'] as const).flatMap((theme) => accents.map((accent) => [theme, accent] as const))

describe.each(combos)('%s theme, %s accent', (theme, accent) => {
  const tokens = resolve(theme, accent)
  const get = (name: string): Hsl => {
    const value = tokens[name]
    if (!value) throw new Error(`${name} is not a plain hsl() token in ${theme}/${accent}`)
    return value
  }

  it.each(['--color-text', '--color-text-2', '--color-text-muted'])('%s reads at 4.5:1 on every surface', (name) => {
    for (const surface of surfaces) {
      expect(ratio(get(name), get(surface)), `${name} on ${surface}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it.each(statusText)('%s works as text on every surface at 4.5:1', (name) => {
    for (const surface of surfaces) {
      expect(ratio(get(name), get(surface)), `${name} on ${surface}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('accent link text reads on the page background', () => {
    expect(ratio(get('--color-accent-text'), get('--color-bg'))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(solids)('--color-on-solid is readable on %s', (name) => {
    expect(ratio(get('--color-on-solid'), get(name)), `on-solid on ${name}`).toBeGreaterThanOrEqual(4.5)
  })

  it('form control borders reach 3:1 against the fills inputs use', () => {
    for (const fill of ['--color-bg', '--color-surface', '--color-surface-2']) {
      expect(ratio(get('--color-input-border'), get(fill)), `input border on ${fill}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('focus ring (accent) reaches 3:1 against surfaces', () => {
    for (const surface of surfaces) {
      expect(ratio(get('--color-accent'), get(surface)), `accent on ${surface}`).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('focus ring token', () => {
  it('is opaque so it cannot fall below 3:1', () => {
    expect(declarations(':root')['--color-focus-ring']).toBe('var(--color-accent)')
  })
})
