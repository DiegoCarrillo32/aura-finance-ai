import React from 'react'
import { GlassCard } from './glass-card'
import { useProfile, useIncomes, useFixedExpenses, useBudgets } from '@/hooks/use-financials'
import { DollarSign, Landmark, ArrowUpRight, ArrowDownRight, Wallet, Hammer } from 'lucide-react'

export function FinanceSummary() {
  const { data: profile } = useProfile()
  const { data: incomes = [] } = useIncomes()
  const { data: fixedExpenses = [] } = useFixedExpenses()
  const { data: budgets = [] } = useBudgets()

  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    MXN: '$',
    CAD: '$',
    JPY: '¥',
  }
  const symbol = currencySymbols[profile?.currency || 'USD'] || '$'

  // Calculate monthly total income
  const totalMonthlyIncome = incomes.reduce((sum, inc) => {
    let amt = inc.amount
    if (inc.frequency === 'weekly') amt *= 4.33
    else if (inc.frequency === 'biweekly') amt *= 2.16
    else if (inc.frequency === 'one_time') return sum
    return sum + amt
  }, 0)

  // Calculate monthly fixed expenses
  const totalMonthlyExpenses = fixedExpenses.reduce((sum, exp) => {
    let amt = exp.amount
    if (exp.frequency === 'yearly') amt /= 12
    return sum + amt
  }, 0)

  // Calculate monthly budgets
  const totalMonthlyBudgets = budgets.reduce((sum, b) => sum + b.limit_amount, 0)

  // Net Cash Flow (Disposable Income)
  const disposableIncome = Math.max(totalMonthlyIncome - totalMonthlyExpenses - totalMonthlyBudgets, 0)

  // Active Hourly Rate
  let activeHourlyRate = profile?.hourly_rate || 0
  if (profile?.hourly_rate_type === 'auto') {
    activeHourlyRate = totalMonthlyIncome > 0 ? (totalMonthlyIncome / 160) : 0
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Monthly Income */}
      <GlassCard className="relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Monthly Income</p>
            <p className="text-3xl font-extrabold font-mono text-emerald-400">
              {symbol}{totalMonthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
          From {incomes.length} registered sources
        </div>
      </GlassCard>

      {/* Monthly Fixed Expenses */}
      <GlassCard className="relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Fixed Monthly Bills</p>
            <p className="text-3xl font-extrabold font-mono text-rose-400">
              {symbol}{totalMonthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-4">
          Bills & subscriptions registered
        </div>
      </GlassCard>

      {/* Monthly Discretionary Budgets */}
      <GlassCard className="relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Discretionary Budgets</p>
            <p className="text-3xl font-extrabold font-mono text-amber-400">
              {symbol}{totalMonthlyBudgets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-4">
          Food, leisure, and fuel caps
        </div>
      </GlassCard>

      {/* Net Disposable Cash & Hourly Value */}
      <GlassCard glow glowColor="rgba(139, 92, 246, 0.2)" className="relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Net Disposable Savings</p>
            <p className="text-3xl font-extrabold font-mono text-violet-400">
              {symbol}{disposableIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-violet-500/10 p-2.5 rounded-xl border border-violet-500/20 text-violet-400 group-hover:scale-110 transition-transform">
            <Hammer className="w-5 h-5" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-4 font-medium flex justify-between items-center">
          <span>Active Hourly Worth:</span>
          <span className="font-mono text-violet-300 font-bold">{symbol}{activeHourlyRate.toFixed(2)}/hr</span>
        </div>
      </GlassCard>
    </div>
  )
}
