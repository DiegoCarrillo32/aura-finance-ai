'use client'

import React from 'react'
import { FinanceSummary } from '@/components/finance-summary'
import { useIncomes, useFixedExpenses, useBudgets, useSavingsGoals, useTransactions } from '@/hooks/use-financials'
import { GlassCard } from '@/components/glass-card'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Sparkles, BarChart3, PieChart as PieChartIcon, Receipt } from 'lucide-react'

export default function Dashboard() {
  const { data: incomes = [] } = useIncomes()
  const { data: fixedExpenses = [] } = useFixedExpenses()
  const { data: budgets = [] } = useBudgets()
  const { data: savingsGoals = [] } = useSavingsGoals()
  const { data: transactions = [] } = useTransactions()

  // Calculate monthly totals
  const totalMonthlyIncome = incomes.reduce((sum, inc) => {
    let amt = inc.amount
    if (inc.frequency === 'weekly') amt *= 4.33
    else if (inc.frequency === 'biweekly') amt *= 2.16
    else if (inc.frequency === 'one_time') return sum
    return sum + amt
  }, 0)

  const totalMonthlyExpenses = fixedExpenses.reduce((sum, exp) => {
    let amt = exp.amount
    if (exp.frequency === 'yearly') amt /= 12
    return sum + amt
  }, 0)

  const totalMonthlyBudgets = budgets.reduce((sum, b) => sum + b.limit_amount, 0)
  
  // Calculate transactions for current month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })
  
  const totalSpent = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0)
  const leftoverBudget = Math.max(totalMonthlyBudgets - totalSpent, 0)
  const monthlyLeftover = Math.max(totalMonthlyIncome - totalMonthlyExpenses - totalMonthlyBudgets, 0)

  // Pie Chart Data
  const pieData = [
    { name: 'Leftover Income', value: monthlyLeftover },
    { name: 'Fixed Expenses', value: totalMonthlyExpenses },
    { name: 'Spent (Budgets)', value: totalSpent },
    { name: 'Remaining Budgets', value: leftoverBudget },
  ].filter(d => d.value > 0)

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'] // Emerald, Red, Amber, Violet

  // Bar Chart Data (Savings Goals)
  const barData = savingsGoals.map(goal => ({
    name: goal.name.replace('Buy: ', ''),
    current: goal.current_amount,
    target: goal.target_amount,
  }))

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-wide">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-Powered financial insights and visualizations</p>
      </div>

      <FinanceSummary />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income Allocation Pie Chart */}
        <GlassCard className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <PieChartIcon className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold text-foreground tracking-wide">Income Allocation</h2>
          </div>
          <div className="h-64 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">
                Add incomes and expenses to see your allocation.
              </div>
            )}
          </div>
        </GlassCard>

        {/* Savings Goals Progress Bar Chart */}
        <GlassCard className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-foreground tracking-wide">Savings Goals Progress</h2>
          </div>
          <div className="h-64 w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    cursor={{ fill: 'var(--accent)' }}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="current" name="Saved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" name="Target" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">
                Create a savings goal to track your progress.
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Receipt className="w-5 h-5 text-rose-400" />
          <h2 className="text-lg font-bold text-foreground tracking-wide">Recent Transactions</h2>
        </div>
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-card rounded-xl border border-border">
                <div>
                  <div className="font-semibold text-foreground">{t.description}</div>
                  <div className="text-xs text-muted-foreground">{t.category} • {t.date}</div>
                </div>
                <div className="font-mono font-bold text-rose-400">-{t.amount}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground italic">
            No transactions logged yet. Upload a receipt in the Aura chat!
          </div>
        )}
      </GlassCard>
    </div>
  )
}
