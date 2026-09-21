'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestPasswordReset, signIn, signUp } from '@/lib/auth-client'
import { TerminalSquare, Loader2, Sparkles, MailCheck, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = React.useState(true)
  const [isForgotPassword, setIsForgotPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [verificationSent, setVerificationSent] = React.useState(false)
  const [resetRequested, setResetRequested] = React.useState(false)
  
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)

  const passwordRequirements = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'At least one letter', valid: /[A-Za-z]/.test(password) },
    { label: 'At least one number', valid: /\d/.test(password) },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isForgotPassword) {
      setLoading(true)
      try {
        const { error } = await requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` })
        if (error) {
          toast.error(error.message || 'Unable to request password reset.')
          return
        }
        setResetRequested(true)
        toast.success('Check the server console for your password reset link.')
      } catch {
        toast.error('Unable to request password reset.')
      } finally {
        setLoading(false)
      }
      return
    }

    if (!isLogin) {
      const meetsRequirements = passwordRequirements.every(requirement => requirement.valid)
      if (!meetsRequirements) {
        toast.error('Password must be at least 8 characters and include a letter and a number.')
        return
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match.')
        return
      }
    }

    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn.email({ email, password })
        if (error) {
          toast.error(error.message || 'Failed to authenticate')
          return
        }
        toast.success("Welcome back to DevOS")
        router.push('/')
      } else {
        const { error } = await signUp.email({ name, email, password })
        if (error) {
          const message = error.message?.toLowerCase().includes('already')
            ? 'An account with this email already exists. Please sign in or reset your password.'
            : error.message || 'Registration failed'
          toast.error(message)
          return
        }
        // Instead of automatically signing in, show verification prompt!
        setVerificationSent(true)
        toast.success("Identity created! Check your console/email to verify.")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  if (resetRequested) {
    return (
      <AuthMessage title="Reset link requested" message="Check the server console for the reset link, then open it to choose a new password." onBack={() => setResetRequested(false)} />
    )
  }

  if (isForgotPassword) {
    return (
      <AuthShell>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Reset your password</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Enter your account email to request a reset link.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="dev@system.local" aria-label="Account email" />
          <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" size={18} /> : 'Send reset link'}</Button>
          <button type="button" onClick={() => setIsForgotPassword(false)} className="text-sm text-[var(--color-accent)] inline-flex items-center justify-center gap-2"><ArrowLeft size={16} /> Back to login</button>
        </form>
      </AuthShell>
    )
  }

  // Verification Prompt UI
  if (verificationSent) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[var(--color-bg)] overflow-hidden relative">
        <BackgroundEffects />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className="relative z-10 w-full max-w-md"
        >
          <Card className="p-8 flex flex-col items-center text-center gap-6 border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80 backdrop-blur-2xl shadow-[0_0_80px_rgba(var(--color-accent-rgb),0.1)]">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center"
            >
              <MailCheck size={32} />
            </motion.div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">Verify Your Identity</h1>
              <p className="text-[14px] text-[var(--color-text-2)]">
                We've securely registered your identity. Please check the server console (since SMTP is disabled) for your verification link before authenticating.
              </p>
            </div>
            <Button 
              className="w-full mt-4 font-semibold shadow-md" 
              onClick={() => {
                setVerificationSent(false)
                setIsLogin(true)
                setPassword('')
              }}
            >
              Return to Authentication
            </Button>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[var(--color-bg)] overflow-hidden relative">
      <BackgroundEffects />
      
      <motion.div 
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Card className="p-8 relative flex flex-col gap-6 border border-white/5 bg-[var(--color-surface)]/60 backdrop-blur-3xl shadow-[0_0_80px_rgba(var(--color-accent-rgb),0.15)] overflow-hidden">
          
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          <div className="flex flex-col items-center text-center gap-4 mb-2 relative z-10">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-violet-600 text-white flex items-center justify-center shadow-lg shadow-[var(--color-accent)]/25 ring-1 ring-white/20"
            >
              <TerminalSquare size={28} strokeWidth={1.5} />
            </motion.div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight flex items-center gap-2 justify-center">
                {isLogin ? 'DevOS' : 'Initialize'} 
                {!isLogin && <Sparkles size={20} className="text-[var(--color-accent)]" />}
              </h1>
              <p className="text-[14px] text-[var(--color-text-2)] mt-1.5 font-medium">
                {isLogin ? 'Command Center Authentication' : 'Establish your developer identity'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3, type: 'spring', bounce: 0 }}
                  className="flex flex-col gap-1.5"
                >
                  <label className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider ml-1">Alias / Name</label>
                  <Input 
                    required 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Root User" 
                    className="h-11 bg-[var(--color-surface-2)]/50 border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all rounded-xl shadow-inner"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
              <div className="relative flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider ml-1">Email Node</label>
              <Input 
                required 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dev@system.local" 
                className="h-11 bg-[var(--color-surface-2)]/50 border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all rounded-xl shadow-inner"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider ml-1">Passphrase</label>
                {isLogin && (
                  <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[12px] font-medium text-[var(--color-accent)] hover:underline">
                    Override?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input 
                  required 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••" 
                  className="h-11 bg-[var(--color-surface-2)]/50 border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all rounded-xl shadow-inner pr-11"
                />
                <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider ml-1">Confirm Passphrase</label>
                  <Input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your passphrase"
                    className="h-11 bg-[var(--color-surface-2)]/50 border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all rounded-xl shadow-inner"
                  />
                </div>
                <ul className="space-y-1 text-xs text-[var(--color-text-muted)]" aria-label="Password requirements">
                  {passwordRequirements.map(requirement => (
                    <li key={requirement.label} className={requirement.valid ? 'text-green-400' : undefined}>
                      {requirement.valid ? '✓' : '○'} {requirement.label}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              className="h-11 w-full mt-2 font-semibold shadow-lg shadow-[var(--color-accent)]/20 rounded-xl transition-all hover:shadow-[var(--color-accent)]/40 hover:-translate-y-0.5 active:translate-y-0 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white" 
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <Loader2 size={18} />
                </motion.div>
              ) : (
                isLogin ? 'Initiate Session' : 'Create Identity'
              )}
            </Button>
          </form>

          <div className="text-center pt-5 mt-2 border-t border-[var(--color-border-subtle)] relative z-10">
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
              }}
              className="text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors group"
            >
              {isLogin ? "No identity found? " : "Identity established? "}
              <span className="text-[var(--color-accent)] group-hover:underline">
                {isLogin ? "Initialize one." : "Authenticate."}
              </span>
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <Card className="relative z-10 w-full max-w-md p-8 space-y-6 bg-[var(--color-surface)] border-white/10">
        {children}
      </Card>
    </main>
  )
}

function AuthMessage({ title, message, onBack }: { title: string; message: string; onBack: () => void }) {
  return (
    <AuthShell>
      <div className="space-y-3 text-center">
        <MailCheck className="mx-auto text-green-400" size={32} />
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{title}</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
        <Button type="button" onClick={onBack} className="w-full">Back to login</Button>
      </div>
    </AuthShell>
  )
}

function BackgroundEffects() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--color-surface)] via-[var(--color-bg)] to-[var(--color-bg)]" />
      
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[var(--color-accent)] blur-[140px] rounded-full mix-blend-screen" 
      />
      
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-violet-600 blur-[150px] rounded-full mix-blend-screen" 
      />
      
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
    </div>
  )
}
