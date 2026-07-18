'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
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

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  // Avoid hydration mismatch by waiting for mount
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? 56 : 240,
      }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col overflow-hidden shrink-0 relative"
    >
      {/* ── Logo Area ── */}
      <div className="h-[48px] flex items-center px-4 shrink-0">
        <div className="w-6 h-6 rounded-md bg-[var(--color-accent)] flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-[var(--color-bg)]">D</span>
        </div>
        <motion.span
          initial={false}
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          className="ml-3 font-semibold text-[var(--color-text)] whitespace-nowrap"
        >
          DevOS
        </motion.span>
      </div>

      {/* ── Toggle Button ── */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-3 -right-3 z-10 w-6 h-6 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-full flex items-center justify-center text-[var(--color-text-2)] hover:text-[var(--color-text)] cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* ── Navigation ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              href={item.path}
              title={isCollapsed && mounted ? item.name : undefined}
              className={cn(
                'flex items-center h-8 px-[12px] rounded-md transition-colors duration-150 group relative',
                isActive
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-text)]'
                  : 'text-[var(--color-text-2)] hover:bg-[hsl(0_0%_100%_/_0.05)] hover:text-[var(--color-text)]'
              )}
            >
              <Icon
                size={16}
                className={cn('shrink-0', isActive ? 'text-[var(--color-accent)]' : '')}
              />
              <motion.span
                initial={false}
                animate={{ opacity: isCollapsed ? 0 : 1 }}
                className="ml-2 whitespace-nowrap font-medium text-[13px]"
              >
                {item.name}
              </motion.span>
            </Link>
          )
        })}
      </div>

      {/* ── Settings (Bottom) ── */}
      <div className="p-3 shrink-0">
        <Link
          href="/settings"
          title={isCollapsed && mounted ? 'Settings' : undefined}
          className={cn(
            'flex items-center h-8 px-[12px] rounded-md transition-colors duration-150 group',
            pathname === '/settings'
              ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-text)]'
              : 'text-[var(--color-text-2)] hover:bg-[hsl(0_0%_100%_/_0.05)] hover:text-[var(--color-text)]'
          )}
        >
          <Settings
            size={16}
            className={cn('shrink-0', pathname === '/settings' ? 'text-[var(--color-accent)]' : '')}
          />
          <motion.span
            initial={false}
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            className="ml-2 whitespace-nowrap font-medium text-[13px]"
          >
            Settings
          </motion.span>
        </Link>
      </div>
    </motion.aside>
  )
}
