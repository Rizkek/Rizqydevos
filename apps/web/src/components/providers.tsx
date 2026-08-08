'use client'

import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { useUIStore } from '@/stores/ui.store'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  const theme = useUIStore((state) => state.theme)
  const accentColor = useUIStore((state) => state.accentColor)

  // Apply theme to document
  React.useEffect(() => {
    const root = document.documentElement
    
    // Handle system theme
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.setAttribute('data-theme', systemTheme)
    } else {
      root.setAttribute('data-theme', theme)
    }
    
    // Handle accent color (setting a data attribute allows us to use CSS overrides if needed)
    root.setAttribute('data-accent', accentColor)
  }, [theme, accentColor])

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        {children}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            },
            className: 'text-[13px] font-sans',
          }} 
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </NuqsAdapter>
    </QueryClientProvider>
  )
}
