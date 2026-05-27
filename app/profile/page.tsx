'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react'
import { useProfile, useUpdateProfile, useIncomes, useFixedExpenses, useBudgets, useSavingsGoals } from '@/hooks/use-financials'
import { GlassCard } from '@/components/glass-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Coins, Landmark, Shield, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { data: profile, isLoading: isProfileLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const { data: incomes = [] } = useIncomes()
  const { data: fixedExpenses = [] } = useFixedExpenses()
  const { data: budgets = [] } = useBudgets()
  const { data: goals = [] } = useSavingsGoals()

  const [fullName, setFullName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [hourlyRateType, setHourlyRateType] = useState<'manual' | 'auto'>('auto')
  const [manualRate, setManualRate] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setCurrency(profile.currency || 'USD')
      setHourlyRateType(profile.hourly_rate_type || 'auto')
      setManualRate(profile.hourly_rate?.toString() || '0')
    }
  }, [profile])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const rateVal = parseFloat(manualRate)
      await updateProfile.mutateAsync({
        full_name: fullName,
        currency,
        hourly_rate_type: hourlyRateType,
        hourly_rate: isNaN(rateVal) ? 0 : rateVal,
      })
      toast.success('Profile settings updated successfully!')
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to save profile settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isProfileLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <Sparkles className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground font-medium">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-wide">Settings Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage profile attributes and interface parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <GlassCard className="space-y-6">
            <div className="flex items-center gap-2 border-b border-border/40 pb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold tracking-wide">Personal Credentials</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Full Name</label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-card/50 border-border text-foreground focus-visible:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Display Currency</label>
                  <Select value={currency} onValueChange={(val) => setCurrency(val || 'USD')}>
                    <SelectTrigger className="bg-card/50 border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground">
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="MXN">MXN ($)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Hourly Rate calculation configs */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h3 className="text-sm font-bold tracking-wide flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-primary" /> Valuation Model
                </h3>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-accent/10 border border-border/40 rounded-xl gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Rate Derivation Policy</p>
                    <p className="text-xs text-muted-foreground">Select how your hourly work rate is calculated.</p>
                  </div>
                  <div className="flex bg-card p-1 rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => setHourlyRateType('auto')}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                        hourlyRateType === 'auto'
                          ? 'bg-primary text-primary-foreground shadow'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Auto Derived
                    </button>
                    <button
                      type="button"
                      onClick={() => setHourlyRateType('manual')}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                        hourlyRateType === 'manual'
                          ? 'bg-primary text-primary-foreground shadow'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Manual Limit
                    </button>
                  </div>
                </div>

                {hourlyRateType === 'manual' ? (
                  <div className="space-y-1.5 max-w-xs transition-all">
                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Manual Hourly Rate Value</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={manualRate}
                        onChange={(e) => setManualRate(e.target.value)}
                        className="bg-card/50 border-border text-foreground font-mono"
                        min="0"
                        step="any"
                      />
                      <span className="text-sm font-medium text-muted-foreground self-center">/ hr</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic bg-accent/5 p-3 rounded-lg border border-border/20">
                    Implied hourly rate is automatically computed by taking your total recurring monthly income (${incomes.reduce((s, i) => s + (i.frequency === 'weekly' ? i.amount * 4.33 : i.frequency === 'biweekly' ? i.amount * 2.16 : i.frequency === 'monthly' ? i.amount : 0), 0).toFixed(2)}) divided by 160 standard working hours.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border/40">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="space-y-4">
            <h2 className="text-md font-bold tracking-wide flex items-center gap-2">
              <Coins className="w-5 h-5 text-secondary" /> Account Ledger
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">Incomes Registered</span>
                <span className="font-bold font-mono">{incomes.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">Fixed Monthly Bills</span>
                <span className="font-bold font-mono">{fixedExpenses.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">Category Budgets</span>
                <span className="font-bold font-mono">{budgets.length}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Active Savings Goals</span>
                <span className="font-bold font-mono">{goals.length}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="bg-card/50 border border-border text-foreground space-y-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-violet-400" /> Data Security
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Aura Finance enforces database Row-Level Security (RLS). All financial assets, analytics details, and conversation transcripts are protected and private to your personal user account.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
