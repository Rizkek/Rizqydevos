'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { signIn } from '@/lib/auth-client'
import { Command, Mail, Key } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await signIn.email({
        email,
        password,
      })
      
      if (error) {
        setError(error.message || 'Login failed')
      } else {
        router.push('/')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle background glow */}
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[var(--color-accent)]/10 blur-[120px]" />
        <div className="absolute bottom-[0%] right-[0%] w-[40%] h-[40%] rounded-full bg-[var(--color-accent)]/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm z-10"
      >
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden">
          
          <div className="p-8 pb-6 text-center border-b border-[var(--color-border-subtle)]">
            <div className="w-12 h-12 mx-auto bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg flex items-center justify-center mb-4 text-[var(--color-accent)] shadow-accent">
              <Command size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              DevOS
            </h1>
            <p className="text-sm text-[var(--color-text-2)] mt-1">
              Personal Command Center
            </p>
          </div>

          <div className="p-8 pt-6">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-[var(--color-danger)] bg-[var(--color-danger-muted)] rounded-md border border-[var(--color-danger)]/20">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--color-text-2)] uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={14} className="text-[var(--color-text-muted)]" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-md text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:border-[var(--color-accent)] transition-all"
                    placeholder="engineer@devos.local"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--color-text-2)] uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={14} className="text-[var(--color-text-muted)]" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-md text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:border-[var(--color-accent)] transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 h-9 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium text-[13px] rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
          <p>DevOS is a private workspace.</p>
          <p className="mt-1">Public registration is disabled.</p>
        </div>
      </motion.div>
    </div>
  )
}
