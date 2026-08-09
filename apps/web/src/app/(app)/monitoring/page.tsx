'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ShieldCheck,
  Globe,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
} from 'lucide-react'

const API = 'http://localhost:3001/api/v1'

const DEFAULT_HOSTS = ['google.com', 'github.com', 'vercel.com']
const DEFAULT_URLS = ['http://localhost:3001/api/v1', 'https://github.com']

function SslBadge({ status, days }: { status: string; days: number }) {
  if (status === 'VALID') return (
    <Badge className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 h-5 text-[10px]">
      <CheckCircle2 size={10} /> {days}d left
    </Badge>
  )
  if (status === 'EXPIRING_SOON') return (
    <Badge className="gap-1 bg-yellow-500/10 text-yellow-400 border-yellow-500/20 h-5 text-[10px]">
      <AlertTriangle size={10} /> {days}d left
    </Badge>
  )
  if (status === 'EXPIRED') return (
    <Badge className="gap-1 bg-red-500/10 text-red-400 border-red-500/20 h-5 text-[10px]">
      <XCircle size={10} /> Expired
    </Badge>
  )
  return (
    <Badge className="gap-1 bg-gray-500/10 text-gray-400 border-gray-500/20 h-5 text-[10px]">
      <XCircle size={10} /> Error
    </Badge>
  )
}

function HealthBadge({ online, latency }: { online: boolean; latency?: number }) {
  if (online) return (
    <Badge className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 h-5 text-[10px]">
      <CheckCircle2 size={10} /> Online {latency ? `· ${latency}ms` : ''}
    </Badge>
  )
  return (
    <Badge className="gap-1 bg-red-500/10 text-red-400 border-red-500/20 h-5 text-[10px]">
      <XCircle size={10} /> Offline
    </Badge>
  )
}

export default function MonitoringPage() {
  const [sslHosts, setSslHosts] = React.useState<string[]>(DEFAULT_HOSTS)
  const [healthUrls, setHealthUrls] = React.useState<string[]>(DEFAULT_URLS)
  const [newHost, setNewHost] = React.useState('')
  const [newUrl, setNewUrl] = React.useState('')

  const { data: sslResults = [], isLoading: sslLoading, refetch: refetchSsl } = useQuery({
    queryKey: ['ssl-batch', sslHosts],
    queryFn: async () => {
      const res = await fetch(`${API}/monitoring/ssl/batch?hostnames=${sslHosts.join(',')}`)
      if (!res.ok) throw new Error('SSL check failed')
      return res.json()
    },
    refetchInterval: 60_000, // refetch every minute
  })

  const { data: healthResults = [], isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['health-batch', healthUrls],
    queryFn: async () => {
      const res = await fetch(`${API}/monitoring/health/batch?urls=${encodeURIComponent(healthUrls.join(','))}`)
      if (!res.ok) throw new Error('Health check failed')
      return res.json()
    },
    refetchInterval: 30_000, // refetch every 30s
  })

  const addHost = () => {
    if (!newHost.trim() || sslHosts.includes(newHost.trim())) return
    setSslHosts(prev => [...prev, newHost.trim()])
    setNewHost('')
  }

  const addUrl = () => {
    if (!newUrl.trim() || healthUrls.includes(newUrl.trim())) return
    setHealthUrls(prev => [...prev, newUrl.trim()])
    setNewUrl('')
  }

  const validSsl = (sslResults as any[]).filter(r => r.status === 'VALID').length
  const warningSsl = (sslResults as any[]).filter(r => r.status === 'EXPIRING_SOON').length
  const onlineHealth = (healthResults as any[]).filter(r => r.online).length

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] flex items-center gap-2">
          <Activity size={20} className="text-[var(--color-accent)]" /> Monitoring
        </h1>
        <p className="text-[14px] text-[var(--color-text-2)] mt-1">SSL certificate tracking and endpoint health checks</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-[var(--color-surface)] border-[var(--color-border-subtle)]">
          <div className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Monitored Endpoints</div>
          <div className="text-3xl font-bold text-[var(--color-text)] mt-1">{healthUrls.length}</div>
          <div className="text-[12px] text-emerald-400 mt-1">{onlineHealth} online</div>
        </Card>
        <Card className="p-4 bg-[var(--color-surface)] border-[var(--color-border-subtle)]">
          <div className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">SSL Certs Tracked</div>
          <div className="text-3xl font-bold text-[var(--color-text)] mt-1">{sslHosts.length}</div>
          <div className="text-[12px] text-emerald-400 mt-1">{validSsl} valid</div>
        </Card>
        <Card className="p-4 bg-[var(--color-surface)] border-[var(--color-border-subtle)]">
          <div className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Expiring Soon</div>
          <div className={`text-3xl font-bold mt-1 ${warningSsl > 0 ? 'text-yellow-400' : 'text-[var(--color-text)]'}`}>{warningSsl}</div>
          <div className="text-[12px] text-[var(--color-text-muted)] mt-1">within 30 days</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* SSL Tracker */}
        <Card className="flex flex-col bg-[var(--color-surface)] border-[var(--color-border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
            <h3 className="font-medium text-[var(--color-text)] flex items-center gap-2">
              <ShieldCheck size={15} className="text-[var(--color-text-2)]" /> SSL Certificates
            </h3>
            <Button variant="ghost" size="sm" onClick={() => refetchSsl()} className="h-7 text-[11px] gap-1">
              <Clock size={11} /> Refresh
            </Button>
          </div>
          <div className="p-3 border-b border-[var(--color-border-subtle)] flex gap-2 shrink-0">
            <Input
              placeholder="add hostname (e.g. example.com)"
              value={newHost}
              onChange={e => setNewHost(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHost()}
              className="h-7 text-[12px] bg-[var(--color-surface-2)] font-mono"
            />
            <Button size="sm" className="h-7 w-7 p-0 shrink-0" onClick={addHost}><Plus size={13} /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sslLoading ? (
              <div className="flex items-center justify-center h-full gap-2 text-[var(--color-text-2)] text-[12px]">
                <Loader2 size={14} className="animate-spin" /> Checking certs...
              </div>
            ) : (sslResults as any[]).map((r: any) => (
              <div key={r.hostname} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--color-surface-2)]/50 border border-[var(--color-border-subtle)] group">
                <Globe size={14} className="text-[var(--color-text-2)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-mono font-medium text-[var(--color-text)] truncate">{r.hostname}</div>
                  {r.issuer && <div className="text-[10px] text-[var(--color-text-muted)] truncate mt-0.5">Issuer: {r.issuer}</div>}
                </div>
                <SslBadge status={r.status} days={r.daysRemaining} />
                <button onClick={() => setSslHosts(prev => prev.filter(h => h !== r.hostname))} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Health Checks */}
        <Card className="flex flex-col bg-[var(--color-surface)] border-[var(--color-border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
            <h3 className="font-medium text-[var(--color-text)] flex items-center gap-2">
              <Activity size={15} className="text-[var(--color-text-2)]" /> Health Checks
            </h3>
            <Button variant="ghost" size="sm" onClick={() => refetchHealth()} className="h-7 text-[11px] gap-1">
              <Clock size={11} /> Refresh
            </Button>
          </div>
          <div className="p-3 border-b border-[var(--color-border-subtle)] flex gap-2 shrink-0">
            <Input
              placeholder="add URL (e.g. https://api.example.com)"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addUrl()}
              className="h-7 text-[12px] bg-[var(--color-surface-2)] font-mono"
            />
            <Button size="sm" className="h-7 w-7 p-0 shrink-0" onClick={addUrl}><Plus size={13} /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {healthLoading ? (
              <div className="flex items-center justify-center h-full gap-2 text-[var(--color-text-2)] text-[12px]">
                <Loader2 size={14} className="animate-spin" /> Pinging endpoints...
              </div>
            ) : (healthResults as any[]).map((r: any) => (
              <div key={r.url} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--color-surface-2)]/50 border border-[var(--color-border-subtle)] group">
                <div className={`w-2 h-2 rounded-full shrink-0 ${r.online ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-mono text-[var(--color-text)] truncate">{r.url}</div>
                  {r.statusCode && <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">HTTP {r.statusCode}</div>}
                  {r.error && <div className="text-[10px] text-red-400 mt-0.5 truncate">{r.error}</div>}
                </div>
                <HealthBadge online={r.online} latency={r.latencyMs} />
                <button onClick={() => setHealthUrls(prev => prev.filter(u => u !== r.url))} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}