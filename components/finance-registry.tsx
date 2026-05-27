import React, { useState } from 'react'
import { GlassCard } from './glass-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useProfile,
  useUpdateProfile,
  useIncomes,
  useAddIncome,
  useDeleteIncome,
  useFixedExpenses,
  useAddFixedExpense,
  useDeleteFixedExpense,
  useBudgets,
  useAddBudget,
  useDeleteBudget
} from '@/hooks/use-financials'
import { Plus, Trash2, Shield, DollarSign, Calendar, Landmark, Percent } from 'lucide-react'
import { toast } from 'sonner'

export function FinanceRegistry() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    MXN: '$',
    CAD: '$',
    JPY: '¥',
  }
  const symbol = currencySymbols[profile?.currency || 'USD'] || '$'

  const { data: incomes = [] } = useIncomes()
  const addIncome = useAddIncome()
  const deleteIncome = useDeleteIncome()

  const { data: fixedExpenses = [] } = useFixedExpenses()
  const addExpense = useAddFixedExpense()
  const deleteExpense = useDeleteFixedExpense()

  const { data: budgets = [] } = useBudgets()
  const addBudget = useAddBudget()
  const deleteBudget = useDeleteBudget()

  // State for Income Form
  const [incSource, setIncSource] = useState('')
  const [incAmount, setIncAmount] = useState('')
  const [incFreq, setIncFreq] = useState<'weekly' | 'biweekly' | 'monthly' | 'one_time'>('monthly')

  // State for Expense Form
  const [expName, setExpName] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expCategory, setExpCategory] = useState('')
  const [expDueDay, setExpDueDay] = useState('')

  // State for Budget Form
  const [budgCategory, setBudgCategory] = useState('')
  const [budgLimit, setBudgLimit] = useState('')

  // Toggle hourly rate type
  const handleToggleRateType = async (type: 'manual' | 'auto') => {
    try {
      await updateProfile.mutateAsync({ hourly_rate_type: type })
      toast.success(`Hourly rate source set to ${type}`)
    } catch (err) {
      toast.error('Failed to update rate settings')
    }
  }

  const handleUpdateManualRate = async (rate: number) => {
    try {
      await updateProfile.mutateAsync({ hourly_rate: rate })
    } catch (err) {
      console.error(err)
    }
  }

  // Submit Income
  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(incAmount)
    if (!incSource || isNaN(amt) || amt <= 0) return

    try {
      await addIncome.mutateAsync({
        source: incSource,
        amount: amt,
        frequency: incFreq,
        start_date: new Date().toISOString().split('T')[0],
        description: null,
      })
      setIncSource('')
      setIncAmount('')
      toast.success('Income added!')
    } catch (err) {
      toast.error('Failed to add income')
    }
  }

  // Submit Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(expAmount)
    const due = parseInt(expDueDay)
    if (!expName || isNaN(amt) || amt <= 0 || !expCategory) return

    try {
      await addExpense.mutateAsync({
        name: expName,
        amount: amt,
        category: expCategory,
        due_date_day: isNaN(due) ? null : due,
        frequency: 'monthly',
      })
      setExpName('')
      setExpAmount('')
      setExpCategory('')
      setExpDueDay('')
      toast.success('Expense added!')
    } catch (err) {
      toast.error('Failed to add expense')
    }
  }

  // Submit Budget
  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    const limit = parseFloat(budgLimit)
    if (!budgCategory || isNaN(limit) || limit < 0) return

    try {
      await addBudget.mutateAsync({
        category: budgCategory,
        limit_amount: limit,
        period: 'monthly',
      })
      setBudgCategory('')
      setBudgLimit('')
      toast.success('Budget cap updated!')
    } catch (err) {
      toast.error('Failed to update budget')
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* LEFT COLUMN: Incomes and Profile */}
      <div className="space-y-8">
        {/* Profile Settings */}
        <GlassCard className="space-y-4">
          <h2 className="text-lg font-bold text-foreground tracking-wide flex items-center gap-2 mb-6">
            <Landmark className="w-5 h-5 text-violet-400" /> Hourly Rate settings
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Rate Calculation Mode</p>
              <p className="text-xs text-muted-foreground">Auto mode computes implied hourly rate based on total income.</p>
            </div>
            <div className="flex bg-card p-1 rounded-lg border border-border">
              <button
                onClick={() => handleToggleRateType('auto')}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  profile?.hourly_rate_type === 'auto'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Auto Compute
              </button>
              <button
                onClick={() => handleToggleRateType('manual')}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  profile?.hourly_rate_type === 'manual'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Manual
              </button>
            </div>
          </div>

          {profile?.hourly_rate_type === 'manual' ? (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-semibold">Define manual hourly rate</label>
              <div className="flex gap-2 max-w-xs">
                <Input
                  type="number"
                  placeholder="e.g. 45.00"
                  defaultValue={profile?.hourly_rate}
                  onBlur={(e) => handleUpdateManualRate(parseFloat(e.target.value) || 0)}
                  className="bg-card border-border text-foreground font-mono"
                />
                <span className="text-sm font-medium self-center text-muted-foreground">/ hour</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Current calculated implied rate: <span className="font-mono text-emerald-400 font-bold">{symbol}{(profile?.hourly_rate || 0).toFixed(2)}/hr</span>
            </div>
          )}
        </GlassCard>

        {/* Incomes Registry */}
        <GlassCard className="space-y-6">
          <h2 className="text-lg font-bold text-foreground tracking-wide mb-6">Income Sources</h2>

          {/* Add Income Form */}
          <form onSubmit={handleAddIncome} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-semibold">Source Name</label>
              <Input
                type="text"
                placeholder="e.g. Main Salary"
                value={incSource}
                onChange={(e) => setIncSource(e.target.value)}
                className="bg-card border-border text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-semibold">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={incAmount}
                onChange={(e) => setIncAmount(e.target.value)}
                className="bg-card border-border text-foreground font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-semibold">Frequency</label>
              <div className="flex gap-2">
                <Select value={incFreq} onValueChange={(val) => val && setIncFreq(val)}>
                  <SelectTrigger className="bg-card border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="one_time">One-time</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="icon" className="bg-violet-600 hover:bg-violet-500 flex-shrink-0 text-white">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </form>

          {/* Incomes List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {incomes.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">No incomes registered yet.</p>
            ) : (
              incomes.map((inc) => (
                <div key={inc.id} className="flex justify-between items-center bg-card p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{inc.source}</p>
                    <p className="text-xs text-muted-foreground capitalize">{inc.frequency}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-emerald-400 font-bold">{symbol}{inc.amount.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteIncome.mutate(inc.id)}
                      className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* RIGHT COLUMN: Expenses & Budgets */}
      <div className="space-y-8">
        {/* Fixed Expenses Registry */}
        <GlassCard className="space-y-6">
          <h2 className="text-lg font-bold text-foreground tracking-wide mb-6">Fixed Bills & Expenses (Monthly)</h2>

          {/* Add Expense Form */}
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-muted-foreground font-semibold">Expense Name</label>
              <Input
                type="text"
                placeholder="e.g. Rent, Netflix"
                value={expName}
                onChange={(e) => setExpName(e.target.value)}
                className="bg-card border-border text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-semibold">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                className="bg-card border-border text-foreground font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-semibold">Category</label>
              <Input
                type="text"
                placeholder="e.g. Housing"
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="bg-card border-border text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-semibold">Due Day (1-31)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="e.g. 5"
                  value={expDueDay}
                  onChange={(e) => setExpDueDay(e.target.value)}
                  className="bg-card border-border text-foreground font-mono"
                  min="1"
                  max="31"
                />
                <Button type="submit" size="icon" className="bg-violet-600 hover:bg-violet-500 flex-shrink-0 text-white">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </form>

          {/* Expenses List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {fixedExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">No fixed expenses registered.</p>
            ) : (
              fixedExpenses.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center bg-card p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{exp.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {exp.category} {exp.due_date_day ? `• Due on Day ${exp.due_date_day}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-rose-400 font-bold">{symbol}{exp.amount.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteExpense.mutate(exp.id)}
                      className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Budgets Registry */}
        <GlassCard className="space-y-6">
          <h2 className="text-lg font-bold text-foreground tracking-wide mb-6">Category Budgets (Monthly Limits)</h2>

          {/* Add Budget Form */}
          <form onSubmit={handleAddBudget} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-semibold">Category Name</label>
              <Input
                type="text"
                placeholder="e.g. Food, Gas, Fun"
                value={budgCategory}
                onChange={(e) => setBudgCategory(e.target.value)}
                className="bg-card border-border text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-semibold">Monthly Cap Limit</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={budgLimit}
                  onChange={(e) => setBudgLimit(e.target.value)}
                  className="bg-card border-border text-foreground font-mono"
                />
                <Button type="submit" size="icon" className="bg-violet-600 hover:bg-violet-500 flex-shrink-0 text-white">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </form>

          {/* Budgets List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">No budget caps configured.</p>
            ) : (
              budgets.map((b) => (
                <div key={b.id} className="flex justify-between items-center bg-card p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground capitalize">{b.category}</p>
                    <p className="text-xs text-muted-foreground">Monthly budget cap</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-amber-400 font-bold">{symbol}{b.limit_amount.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBudget.mutate(b.id)}
                      className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
