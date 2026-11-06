import { attentionItems, describeDue, itemState, type ChecklistItem } from './checklist'
import { describeHealth, describeSsl, type HealthResult, type Site, type SslResult } from './sites'

export interface AttentionEntry {
  key: string
  title: string
  detail: string
  tone: 'danger' | 'warning'
  href: string
}

interface AttentionInput {
  items: ChecklistItem[]
  sites: Site[]
  health: HealthResult[] | undefined
  ssl: SslResult[] | undefined
  now: Date
}

// What the dashboard flags: overdue or soon-due checklist items, sites that are offline, and SSL certificates
// that expired or expire within 30 days. Danger entries come first; each group keeps its own order.
export function buildAttention({ items, sites, health, ssl, now }: AttentionInput): AttentionEntry[] {
  const entries: AttentionEntry[] = []

  for (const item of attentionItems(items, now)) {
    entries.push({
      key: `item-${item.id}`,
      title: item.title,
      detail: `${item.projectName} · ${describeDue(item.dueAt ?? now.toISOString(), now)}`,
      tone: itemState(item, now) === 'overdue' ? 'danger' : 'warning',
      href: '/security?tab=checklist',
    })
  }

  for (const site of sites) {
    const healthResult = health?.find((result) => result.url === site.url)
    const sslResult = site.https ? ssl?.find((result) => result.hostname === site.hostname) : undefined

    if (healthResult && !healthResult.online) {
      entries.push({ key: `down-${site.url}`, title: `${site.name} is offline`, detail: describeHealth(healthResult), tone: 'danger', href: '/infrastructure' })
    }
    if (sslResult?.status === 'EXPIRED' || sslResult?.status === 'EXPIRING_SOON') {
      entries.push({
        key: `ssl-${site.hostname}`,
        title: `${site.name}: ${describeSsl(sslResult)}`,
        detail: site.hostname,
        tone: sslResult.status === 'EXPIRED' ? 'danger' : 'warning',
        href: '/infrastructure',
      })
    }
  }

  return [...entries.filter((entry) => entry.tone === 'danger'), ...entries.filter((entry) => entry.tone === 'warning')]
}

export function countOpenItems(items: ChecklistItem[], now: Date): number {
  return items.filter((item) => itemState(item, now) === 'open').length
}
