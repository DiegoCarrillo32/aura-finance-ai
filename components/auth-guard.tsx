'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Sparkles, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Sidebar } from './sidebar'
import { ChatDrawer } from './chat-drawer'
import { User as SupabaseUser } from '@supabase/supabase-js'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  // Auth inputs
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        console.error(err)
      } finally {
        setIsAuthLoading(false)
      }
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      toast.success('Welcome back!')
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-foreground min-h-screen">
        <Sparkles className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground font-medium">Initializing Aura core...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-background text-foreground min-h-screen relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-card backdrop-blur-xl border border-border p-8 rounded-2xl shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex bg-primary/10 p-1.5 rounded-2xl border border-primary/20 text-primary mb-2">
              <img src="/LOGO.jpeg" alt="Aura Logo" className="w-12 h-12 object-cover rounded-xl" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Aura Finance</h1>
            <p className="text-sm text-muted-foreground font-medium">AI-Powered financial co-pilot</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">

            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-card border-border text-foreground pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-card border-border text-foreground pl-10"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </div>
        <Toaster theme="dark" position="top-right" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300 w-full">
      <Sidebar user={user} />
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8 w-full max-w-full">
        {/* Soft background ambient lighting for the main content area */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-secondary/[0.03] rounded-full blur-[100px] pointer-events-none -z-10" />
        
        {children}
        
        <ChatDrawer />
      </main>
      <Toaster theme="dark" position="top-right" />
    </div>
  )
}
