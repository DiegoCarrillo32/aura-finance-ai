'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calculator, Target, ListOrdered, Settings, LogOut } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { User as SupabaseUser } from '@supabase/supabase-js'

const navLinks = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Calculator', href: '/calculator', icon: Calculator },
  { name: 'Savings Goals', href: '/goals', icon: Target },
  { name: 'Finance Registry', href: '/registry', icon: ListOrdered },
  { name: 'Settings', href: '/profile', icon: Settings },
]

export function Sidebar({ user }: { user: SupabaseUser | null }) {
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="w-64 bg-card border-r border-border h-full flex flex-col hidden md:flex shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-border">
        <div className="bg-primary/10 p-1.5 rounded-xl border border-primary/20 text-primary">
          <img src="/LOGO.jpeg" alt="Aura Logo" className="w-8 h-8 object-cover rounded-lg" />
        </div>
        <h1 className="text-xl font-extrabold tracking-wide text-foreground">Aura Finance</h1>
      </div>

      <div className="p-4 flex-1 space-y-2 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <Link key={link.name} href={link.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </div>
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="text-sm font-medium truncate text-foreground flex-1 pr-2">
            {user?.user_metadata?.full_name || user?.email}
          </div>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 justify-start gap-3 px-4"
        >
          <LogOut className="w-5 h-5" /> Sign Out
        </Button>
      </div>
    </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/90 backdrop-blur-xl flex items-center justify-around md:hidden z-50 px-2 py-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {navLinks.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          const shortName = link.name.replace('Finance ', '').replace('Savings ', '')
          return (
            <Link key={link.name} href={link.href} className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`p-1.5 rounded-lg ${isActive ? 'bg-primary/10' : 'transparent'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium mt-0.5">{shortName}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
