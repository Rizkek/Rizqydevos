'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  BrainCircuit,
  TerminalSquare,
  ServerCrash,
  ShieldCheck,
  Activity,
  Bot,
  BarChart3,
  Zap,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  path: string
  icon: LucideIcon
}

export const mainNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Projects', path: '/projects', icon: FolderKanban },
  { name: 'Workspace', path: '/workspace', icon: Briefcase },
  { name: 'Knowledge', path: '/knowledge', icon: BrainCircuit },
  { name: 'Developer', path: '/developer', icon: TerminalSquare },
  { name: 'Infrastructure', path: '/infrastructure', icon: ServerCrash },
  { name: 'Security', path: '/security', icon: ShieldCheck },
  { name: 'Monitoring', path: '/monitoring', icon: Activity },
  { name: 'AI', path: '/ai', icon: Bot },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Automation', path: '/automation', icon: Zap },
]

export const settingsNavItem: NavItem = { name: 'Settings', path: '/settings', icon: Settings }

// A section stays active on its sub-pages, e.g. /knowledge/notes/1 keeps Knowledge active.
function isActivePath(pathname: string | null, path: string): boolean {
  if (!pathname) return false
  return path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`)
}

interface NavLinksProps {
  items: NavItem[]
  collapsed?: boolean
  onNavigate?: () => void
}

export function NavLinks({ items, collapsed = false, onNavigate }: NavLinksProps) {
  const pathname = usePathname()

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = isActivePath(pathname, item.path)
        const Icon = item.icon

        return (
          <li key={item.path}>
            <Link
              href={item.path}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.name : undefined}
              {...(onNavigate && { onClick: onNavigate })}
              className={cn(
                'flex items-center h-8 px-3 rounded-md transition-colors duration-150',
                isActive
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-text)]'
                  : 'text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
              )}
            >
              <Icon aria-hidden="true" size={16} className={cn('shrink-0', isActive && 'text-[var(--color-accent-text)]')} />
              <span className={cn('whitespace-nowrap font-medium text-[13px]', collapsed ? 'sr-only' : 'ml-2')}>{item.name}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
