'use client'

import { GoalCard } from '@/components/goal-card'
import { useSavingsGoals } from '@/hooks/use-financials'
import { Sparkles } from 'lucide-react'

export default function GoalsPage() {
  const { data: savingsGoals = [], isLoading } = useSavingsGoals()

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <Sparkles className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground font-medium">Loading goals...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-wide">Savings Goals</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your progress toward your financial targets</p>
      </div>

      <div className="space-y-4">
        {savingsGoals.length === 0 ? (
          <div className="bg-card/50 border border-border backdrop-blur-md rounded-2xl p-8 text-center text-muted-foreground italic">
            No active savings goals. Create one using the Calculator.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {savingsGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
