import React, { useState } from 'react'
import { GlassCard } from './glass-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  useProfile,
  useIncomes,
  useFixedExpenses,
  useBudgets,
  useAddSavingsGoal
} from '@/hooks/use-financials'
import { Briefcase, Coins, Sparkles, Plus } from 'lucide-react'
import { toast } from 'sonner'

export function Calculator() {
  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [targetDays, setTargetDays] = useState('30')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: profile } = useProfile()
  const { data: incomes = [] } = useIncomes()
  const { data: fixedExpenses = [] } = useFixedExpenses()
  const { data: budgets = [] } = useBudgets()
  const addSavingsGoal = useAddSavingsGoal()

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
    else if (inc.frequency === 'one_time') return sum // skip one-time for standard recurring monthly
    return sum + amt
  }, 0)

  // Calculate monthly fixed expenses
  const totalMonthlyExpenses = fixedExpenses.reduce((sum, exp) => {
    let amt = exp.amount
    if (exp.frequency === 'yearly') amt /= 12
    return sum + amt
  }, 0)

  // Calculate monthly budget caps
  const totalMonthlyBudgets = budgets.reduce((sum, b) => sum + b.limit_amount, 0)

  // Net Disposable Income (Leftover)
  const monthlyLeftover = Math.max(totalMonthlyIncome - totalMonthlyExpenses - totalMonthlyBudgets, 0)

  // Calculate Hourly Rate
  let activeHourlyRate = profile?.hourly_rate || 0
  if (profile?.hourly_rate_type === 'auto') {
    activeHourlyRate = totalMonthlyIncome > 0 ? (totalMonthlyIncome / 160) : 0
  }

  const price = parseFloat(itemPrice) || 0
  const hoursNeeded = activeHourlyRate > 0 && price > 0 ? (price / activeHourlyRate) : 0

  // Days of savings needed
  const dailySavings = monthlyLeftover / 30.4
  const daysSavingsNeeded = dailySavings > 0 && price > 0 ? (price / dailySavings) : 0

  const handleCreateGoal = async () => {
    if (!itemName || price <= 0) {
      toast.error('Please enter an item name and valid price')
      return
    }

    try {
      setIsSubmitting(true)
      const targetDate = new Date()
      const days = parseInt(targetDays) || 30
      targetDate.setDate(targetDate.getDate() + days)

      await addSavingsGoal.mutateAsync({
        name: `Buy: ${itemName}`,
        target_amount: price,
        current_amount: 0,
        target_date: targetDate.toISOString().split('T')[0],
        status: 'active',
      })

      toast.success(`Savings Goal created for ${itemName}!`)
      setItemName('')
      setItemPrice('')
    } catch (error) {
      toast.error('Failed to create savings goal')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <GlassCard glow className="space-y-6">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <Sparkles className="w-6 h-6 text-violet-400" />
        <h2 className="text-xl font-bold text-foreground tracking-wide mb-6">Work & Purchase Calculator</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground font-semibold mb-1 block">What do you want to buy?</label>
            <Input
              type="text"
              placeholder="e.g. PlayStation 5 Pro"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="bg-card border-border text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-semibold mb-1 block">Price</label>
              <Input
                type="number"
                placeholder="0.00"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                className="bg-card border-border text-foreground font-mono"
                min="1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold mb-1 block">Target days to buy</label>
              <Input
                type="number"
                placeholder="30"
                value={targetDays}
                onChange={(e) => setTargetDays(e.target.value)}
                className="bg-card border-border text-foreground font-mono"
                min="1"
              />
            </div>
          </div>

          {price > 0 && (
            <Button
              onClick={handleCreateGoal}
              disabled={isSubmitting}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 mt-2"
            >
              <Plus className="w-5 h-5" /> Convert into Savings Goal
            </Button>
          )}
        </div>

        {/* Dynamic Calculations */}
        <div className="bg-card rounded-xl p-5 border border-border flex flex-col justify-between gap-4">
          <div className="space-y-4">
            {/* Work Time Needed */}
            <div className="flex items-start gap-4">
              <div className="bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 text-amber-400 mt-1">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Labor Equivalency</p>
                <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
                  {hoursNeeded > 0 ? `${hoursNeeded.toFixed(1)} hrs` : '0 hrs'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Based on {profile?.hourly_rate_type === 'auto' ? 'implied' : 'your manual'} hourly rate of{' '}
                  <span className="font-mono text-muted-foreground">{symbol}{activeHourlyRate.toFixed(2)}/hr</span>
                </p>
              </div>
            </div>

            {/* Savings Time Needed */}
            <div className="flex items-start gap-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 text-emerald-400 mt-1">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Savings Duration</p>
                <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
                  {daysSavingsNeeded > 0 ? `${daysSavingsNeeded.toFixed(1)} days` : '0 days'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Assuming daily leftover savings rate of{' '}
                  <span className="font-mono text-muted-foreground">{symbol}{dailySavings.toFixed(2)}/day</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-3 text-[11px] text-muted-foreground leading-relaxed">
            Note: Discretionary savings calculations deduct both fixed expenses and budget caps from your total recurring income.
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
