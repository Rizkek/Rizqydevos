// The API checks at most 20 targets per batch request (infrastructure.controller.ts).
export const MAX_SITES = 20

export interface ProjectWithDeployUrl {
  id: string
  name: string
  deployUrl?: string | null
}

export interface Site {
  projectId: string
  name: string
  url: string
  hostname: string
  https: boolean
}

export interface SslResult {
  hostname: string
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'ERROR'
  daysRemaining: number
  issuer?: string
  error?: string
}

export interface HealthResult {
  url: string
  online: boolean
  statusCode?: number
  latencyMs?: number
  error?: string
}

// Deploy URLs are typed by hand in Projects, often without a scheme ("example.com").
function parseDeployUrl(raw: string): URL | null {
  const value = raw.trim()
  if (!value) return null
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

export function sitesFromProjects(projects: ProjectWithDeployUrl[]): Site[] {
  const seen = new Set<string>()
  const sites: Site[] = []

  for (const project of projects) {
    const url = project.deployUrl ? parseDeployUrl(project.deployUrl) : null
    if (!url || seen.has(url.href)) continue
    seen.add(url.href)
    sites.push({
      projectId: project.id,
      name: project.name,
      url: url.href,
      hostname: url.hostname,
      https: url.protocol === 'https:',
    })
  }

  return sites.slice(0, MAX_SITES)
}

export function describeSsl(result: SslResult | undefined): string {
  if (!result) return 'SSL not checked'
  switch (result.status) {
    case 'VALID': return `SSL valid, ${result.daysRemaining} days left`
    case 'EXPIRING_SOON': return `SSL expires in ${result.daysRemaining} days`
    case 'EXPIRED': return 'SSL expired'
    default: return 'SSL check failed'
  }
}

export function describeHealth(result: HealthResult | undefined): string {
  if (!result) return 'Not checked'
  if (result.online) return result.latencyMs === undefined ? 'Online' : `Online, ${result.latencyMs} ms`
  return result.statusCode ? `Offline, HTTP ${result.statusCode}` : 'Offline'
}
