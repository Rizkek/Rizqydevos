import { Geist, Geist_Mono } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'DevOS',
    template: '%s — DevOS',
  },
  description: 'A personal command center for software engineers.',
  keywords: ['developer', 'dashboard', 'workspace', 'devos'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
