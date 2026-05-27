import React, { useState } from 'react'
import { GlassCard } from './glass-card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal, useProfile } from '@/hooks/use-financials'
import { Calendar, Target, TrendingUp, Trash2, CheckCircle2, Circle } from 'lucide-react'

interface GoalCardProps {
  goal: SavingsGoal
}

export function GoalCard({ goal }: GoalCardProps) {
  const [depositAmount, setDepositAmount] = useState('')
  const [isDepositing, setIsDepositing] = useState(false)
  const updateGoal = useUpdateSavingsGoal()
  const deleteGoal = useDeleteSavingsGoal()
  const { data: profile } = useProfile()

  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    MXN: '$',
    CAD: '$',
    JPY: '¥',
  }
  const symbol = currencySymbols[profile?.currency || 'USD'] || '$'

  const percent = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)

  // Custom date math
  const today = new Date()
  const target = new Date(goal.target_date)
  const msDiff = target.getTime() - today.getTime()
  const daysRemaining = Math.max(Math.ceil(msDiff / (1000 * 60 * 60 * 24)), 1)
  const monthsRemaining = Math.max(daysRemaining / 30.4, 0.1)

  const leftToSave = Math.max(goal.target_amount - goal.current_amount, 0)
  const monthlyNeeded = leftToSave > 0 ? (leftToSave / monthsRemaining) : 0
  const dailyNeeded = leftToSave > 0 ? (leftToSave / daysRemaining) : 0

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(depositAmount)
    if (isNaN(amt) || amt <= 0) return

    try {
      setIsDepositing(true)
      await updateGoal.mutateAsync({
        id: goal.id,
        current_amount: goal.current_amount + amt,
        status: goal.current_amount + amt >= goal.target_amount ? 'completed' : goal.status,
      })
      setDepositAmount('')
    } catch (err) {
      console.error(err)
    } finally {
      setIsDepositing(false)
    }
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the goal "${goal.name}"?`)) {
      await deleteGoal.mutateAsync(goal.id)
    }
  }

  // Circular progress dimensions
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <GlassCard
      glow={goal.status === 'completed'}
      glowColor="rgba(34, 197, 94, 0.15)"
      className="flex flex-col md:flex-row items-center justify-between gap-6"
    >
      <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-auto">
        {/* SVG Circular Progress */}
        <div className="relative flex items-center justify-center w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="stroke-border"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="stroke-violet-500 transition-all duration-500 ease-out"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-lg font-bold font-mono text-white">{percent}%</span>
        </div>

        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h3 className="text-xl font-bold text-foreground tracking-wide">{goal.name}</h3>
            {goal.status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <span className="text-xs bg-violet-500/20 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full font-medium">
                Active
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Target Date: {new Date(goal.target_date).toLocaleDateString(undefined, { dateStyle: 'medium' })} ({daysRemaining} days left)
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2 text-left">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Saved</p>
              <p className="text-base font-bold font-mono text-emerald-400">
                {symbol}{goal.current_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Target</p>
              <p className="text-base font-bold font-mono text-foreground">
                {symbol}{goal.target_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto border-t md:border-t-0 border-border pt-4 md:pt-0">
        {goal.status !== 'completed' && (
          <form onSubmit={handleDeposit} className="flex gap-2 flex-grow sm:flex-grow-0">
            <Input
              type="number"
              placeholder="Amount to save"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full sm:w-32 bg-card border-border text-foreground font-mono"
              min="0.01"
              step="any"
            />
            <Button
              type="submit"
              disabled={isDepositing}
              className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
            >
              Save
            </Button>
          </form>
        )}

        <div className="flex flex-col justify-center text-center sm:text-right px-2">
          {leftToSave > 0 ? (
            <>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Recommended Savings Velocity</p>
              <p className="text-sm font-semibold text-violet-400 font-mono">
                {symbol}{monthlyNeeded.toFixed(2)}/mo
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                ({symbol}{dailyNeeded.toFixed(2)}/day)
              </p>
            </>
          ) : (
            <p className="text-sm font-bold text-emerald-400 flex items-center justify-center sm:justify-end gap-1">
              Goal Achieved! 🎉
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 self-center"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </GlassCard>
  )
}
