import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Topbar } from '@/components/layout/topbar'
import { CommandPalette } from '@/components/layout/command-palette'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-dvh w-full bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[var(--z-command)] focus:rounded-md focus:bg-[var(--color-accent)] focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-[var(--color-on-solid)]"
      >
        Skip to main content
      </a>
      <Sidebar />
      <MobileNav />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
