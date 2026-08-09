'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn, signUp } from '@/lib/auth-client'
import { TerminalSquare, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error } = await signIn.email({ email, password })
        if (error) throw new Error(error.message)
        router.push('/')
      } else {
        const { error } = await signUp.email({ name, email, password })
        if (error) throw new Error(error.message)
        // Automatically sign in after sign up
        await signIn.email({ email, password })
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[var(--color-bg)]">
      
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-accent)]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-accent)]/10 blur-[120px] rounded-full" />
      </div>

      <Card className="w-full max-w-md p-8 relative z-10 flex flex-col gap-6 border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center text-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)] text-white flex items-center justify-center shadow-lg shadow-[var(--color-accent)]/20">
            <TerminalSquare size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
              {isLogin ? 'Welcome back' : 'Initialize Identity'}
            </h1>
            <p className="text-[14px] text-[var(--color-text-2)] mt-1">
              Access your personal operating system
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/20 text-[var(--color-destructive)] text-[13px] text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[var(--color-text)]">Name</label>
              <Input 
                required 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Engineer" 
                className="bg-[var(--color-surface-2)] border-[var(--color-border-subtle)]"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[var(--color-text)]">Email</label>
            <Input 
              required 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="dev@rizqy.me" 
              className="bg-[var(--color-surface-2)] border-[var(--color-border-subtle)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-[var(--color-text)]">Password</label>
            </div>
            <Input 
              required 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="bg-[var(--color-surface-2)] border-[var(--color-border-subtle)]"
            />
          </div>

          <Button type="submit" className="w-full mt-2 font-semibold shadow-md shadow-[var(--color-accent)]/10" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : (isLogin ? 'Authenticate' : 'Create Identity')}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-[var(--color-border-subtle)]">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            {isLogin ? "Don't have an identity? Initialize one." : 'Already initialized? Authenticate.'}
          </button>
        </div>
      </Card>
    </div>
  )
}
