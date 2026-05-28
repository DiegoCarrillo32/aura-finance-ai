'use client'

import React, { useState } from 'react'
import { FinanceSummary } from '@/components/finance-summary'
import {
  useProfile,
  useIncomes,
  useFixedExpenses,
  useBudgets,
  useSavingsGoals,
  useTransactions,
  useInstallments,
  useAddTransaction,
  useDeleteTransaction
} from '@/hooks/use-financials'
import { GlassCard } from '@/components/glass-card'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  Receipt,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Dashboard() {
  const { data: profile } = useProfile()
  const { data: incomes = [] } = useIncomes()
  const { data: fixedExpenses = [] } = useFixedExpenses()
  const { data: budgets = [] } = useBudgets()
  const { data: savingsGoals = [] } = useSavingsGoals()
  const { data: transactions = [] } = useTransactions()
  const { data: installments = [] } = useInstallments()

  const addTransaction = useAddTransaction()
  const deleteTransaction = useDeleteTransaction()

  // State for Month/Year Selector
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // State for Transaction Dialog Form
  const [isAddTxOpen, setIsAddTxOpen] = useState(false)
  const [txDesc, setTxDesc] = useState("")
  const [txAmount, setTxAmount] = useState("")
  const [txCategory, setTxCategory] = useState("")
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0])
  const [txCurrency, setTxCurrency] = useState("CRC")

  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    MXN: "$",
    CAD: "$",
    JPY: "¥",
  }
  const symbol = currencySymbols[profile?.currency || "USD"] || "$"

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Dynamic Year List (current year - 2 to + 1)
  const currentYearVal = new Date().getFullYear()
  const years = [currentYearVal - 2, currentYearVal - 1, currentYearVal, currentYearVal + 1]

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(prev => prev - 1)
    } else {
      setSelectedMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(prev => prev + 1)
    } else {
      setSelectedMonth(prev => prev + 1)
    }
  }

  // Calculate monthly totals for the selected month
  const endOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0)
  
  const totalMonthlyIncome = incomes.reduce((sum, inc) => {
    const startDate = new Date(inc.start_date)
    if (startDate > endOfSelectedMonth) return sum

    let amt = inc.amount
    if (inc.frequency === 'weekly') amt *= 4.33
    else if (inc.frequency === 'biweekly') amt *= 2.16
    else if (inc.frequency === 'one_time') {
      const isSameMonth = startDate.getMonth() === selectedMonth && startDate.getFullYear() === selectedYear
      if (!isSameMonth) return sum
      amt = inc.amount
    }
    return sum + amt
  }, 0)

  const totalMonthlyExpenses = fixedExpenses.reduce((sum, exp) => {
    const createdAt = new Date(exp.created_at)
    if (createdAt > endOfSelectedMonth) return sum

    let amt = exp.amount
    if (exp.frequency === 'yearly') amt /= 12
    return sum + amt
  }, 0)

  const totalMonthlyBudgets = budgets.reduce((sum, b) => {
    const createdAt = new Date(b.created_at)
    if (createdAt > endOfSelectedMonth) return sum
    return sum + b.limit_amount
  }, 0)
  
  const activeInstallments = installments.filter(i => {
    const startDate = new Date(i.start_date)
    return startDate <= endOfSelectedMonth && i.installments_paid < i.total_installments
  })
  
  const totalMonthlyInstallments = activeInstallments.reduce((sum, inst) => sum + inst.monthly_amount, 0)

  // Filter transactions for selected month
  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
  })
  
  const totalSpent = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0)
  const leftoverBudget = Math.max(totalMonthlyBudgets - totalSpent, 0)
  const monthlyLeftover = Math.max(totalMonthlyIncome - totalMonthlyExpenses - totalMonthlyBudgets - totalMonthlyInstallments, 0)

  // Spending Breakdown Calculations
  const categorySpentMap: Record<string, number> = {}
  monthlyTransactions.forEach(t => {
    const cat = t.category.toLowerCase().trim()
    categorySpentMap[cat] = (categorySpentMap[cat] || 0) + t.amount
  })

  // Map defined budgets to actual spending
  const budgetBreakdown = budgets.map(b => {
    const catLower = b.category.toLowerCase().trim()
    const spent = categorySpentMap[catLower] || 0
    delete categorySpentMap[catLower] // remove from map so we can isolate unbudgeted categories
    return {
      category: b.category,
      limit: b.limit_amount,
      spent: spent,
      isBudgeted: true
    }
  })

  // Add any categories that have transactions but no explicit budget limit
  const unbudgetedBreakdown = Object.entries(categorySpentMap).map(([cat, spent]) => {
    return {
      category: cat.charAt(0).toUpperCase() + cat.slice(1),
      limit: 0,
      spent: spent,
      isBudgeted: false
    }
  })

  const allCategorySpending = [...budgetBreakdown, ...unbudgetedBreakdown]

  // Pie Chart Data (Income Allocation)
  const pieData = [
    { name: 'Leftover Income', value: monthlyLeftover },
    { name: 'Fixed Expenses', value: totalMonthlyExpenses },
    { name: 'Installments', value: totalMonthlyInstallments },
    { name: 'Spent (Budgets)', value: totalSpent },
    { name: 'Remaining Budgets', value: leftoverBudget },
  ].filter(d => d.value > 0)

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'] // Emerald, Red, Blue, Amber, Violet

  // Bar Chart Data (Savings Goals)
  const barData = savingsGoals.map(goal => ({
    name: goal.name.replace('Buy: ', ''),
    current: goal.current_amount,
    target: goal.target_amount,
  }))

  // Form submit handler for Transaction Logging
  const handleAddTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(txAmount)
    if (!txDesc || isNaN(amt) || amt <= 0 || !txCategory || !txDate) {
      toast.error("Please fill all required fields correctly.")
      return
    }

    let finalAmount = amt
    let finalDesc = txDesc

    const userCur = profile?.currency || "USD"
    const exRate = profile?.exchange_rate || 515
    if (txCurrency !== userCur) {
      if (txCurrency === "USD" && userCur === "CRC") {
        finalAmount = amt * exRate
        finalDesc = `${txDesc} ($${amt.toFixed(2)})`
      } else if (txCurrency === "CRC" && userCur === "USD") {
        finalAmount = amt / exRate
        finalDesc = `${txDesc} (₡${amt.toLocaleString()})`
      }
    }

    try {
      await addTransaction.mutateAsync({
        description: finalDesc,
        amount: finalAmount,
        category: txCategory,
        date: txDate,
      })
      setTxDesc("")
      setTxAmount("")
      setTxCategory("")
      setIsAddTxOpen(false)
      toast.success("Transaction logged successfully!")
    } catch (err) {
      toast.error("Failed to log transaction")
    }
  }

  // Pre-fill and trigger Log Payment for a Fixed Bill (Invoice)
  const handleLogBillPayment = (billName: string, amount: number, category: string) => {
    setTxDesc(`Bill: ${billName}`)
    setTxAmount(amount.toString())
    setTxCategory(category)
    setTxCurrency(profile?.currency || "CRC")
    // Default the date to today or a day in the selected month/year
    const today = new Date()
    const isCurrentMonthYear = today.getMonth() === selectedMonth && today.getFullYear() === selectedYear
    const day = isCurrentMonthYear ? today.getDate() : 15
    const computedDateStr = new Date(selectedYear, selectedMonth, day).toISOString().split('T')[0]
    setTxDate(computedDateStr)
    setIsAddTxOpen(true)
  }

  // Check if a fixed expense has been paid in the current month
  const checkIsBillPaid = (billName: string, category: string) => {
    return monthlyTransactions.some(t => 
      t.description.toLowerCase().includes(billName.toLowerCase()) || 
      (t.category.toLowerCase() === category.toLowerCase() && t.description.toLowerCase().includes("bill"))
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* HEADER SECTION with Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-wide flex items-center gap-2">
            Analytics Dashboard <Sparkles className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">AI-Powered financial insights and visualizations</p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2 bg-card/60 backdrop-blur-md p-1.5 rounded-2xl border border-border">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9 rounded-xl hover:bg-accent cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1.5 px-3 min-w-[200px] justify-center">
            {/* Month Dropdown */}
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(val) => val && setSelectedMonth(parseInt(val))}
            >
              <SelectTrigger className="border-0 bg-transparent p-0 h-auto font-bold text-foreground focus:ring-0 shadow-none hover:opacity-80 gap-1.5 font-sans cursor-pointer text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {months.map((m, idx) => (
                  <SelectItem key={m} value={idx.toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year Dropdown */}
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(val) => val && setSelectedYear(parseInt(val))}
            >
              <SelectTrigger className="border-0 bg-transparent p-0 h-auto font-mono text-muted-foreground focus:ring-0 shadow-none hover:opacity-80 gap-1 font-sans cursor-pointer text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9 rounded-xl hover:bg-accent cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Monthly Financial Summary Cards */}
      <FinanceSummary selectedMonth={selectedMonth} selectedYear={selectedYear} />

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (Analytics & Incomes, Spans 5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Income Allocation Pie Chart */}
          <GlassCard className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <PieChartIcon className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-bold text-foreground tracking-wide">Income Allocation ({months[selectedMonth]})</h2>
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

          {/* Savings Goals Progress */}
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
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${symbol}${val}`} />
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

          {/* Active Installments */}
          <GlassCard className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-foreground tracking-wide">Active Installment Plans</h2>
            </div>
            {activeInstallments.length > 0 ? (
              <div className="space-y-5 p-2">
                {activeInstallments.map((inst) => (
                  <div key={inst.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-foreground">{inst.name}</div>
                      <div className="font-mono font-bold text-blue-400">{symbol}{inst.monthly_amount.toFixed(2)}/mo</div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <div>Paid: {inst.installments_paid} / {inst.total_installments} months</div>
                      <div>Started: {inst.start_date}</div>
                    </div>
                    <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border/50">
                      <div 
                        className="h-2 rounded-full bg-blue-500" 
                        style={{ width: `${Math.min(100, (inst.installments_paid / inst.total_installments) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground italic">
                No active installments. You&apos;re debt free!
              </div>
            )}
          </GlassCard>
        </div>

        {/* RIGHT COLUMN (Ledgers, Category Breakdown & Invoices/Bills, Spans 7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* CATEGORY SPENDING BREAKDOWN */}
          <GlassCard glow glowColor="rgba(245, 158, 11, 0.15)" className="space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-foreground tracking-wide">Category Spending ({months[selectedMonth]})</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-accent/20 border border-border rounded-lg text-foreground font-mono">
                Spent: {symbol}{totalSpent.toFixed(2)} / {symbol}{totalMonthlyBudgets.toFixed(2)}
              </span>
            </div>

            {allCategorySpending.length > 0 ? (
              <div className="space-y-5">
                {allCategorySpending.map((cat, index) => {
                  const percent = cat.limit > 0 ? Math.min(100, (cat.spent / cat.limit) * 100) : (cat.spent > 0 ? 100 : 0)
                  const isOver = cat.limit > 0 && cat.spent > cat.limit
                  const isNear = cat.limit > 0 && cat.spent > cat.limit * 0.75 && cat.spent <= cat.limit
                  
                  let progressColor = "bg-emerald-500"
                  let textGlow = "text-emerald-400"
                  if (isOver) {
                    progressColor = "bg-rose-500"
                    textGlow = "text-rose-400"
                  } else if (isNear) {
                    progressColor = "bg-amber-500"
                    textGlow = "text-amber-400"
                  } else if (!cat.isBudgeted) {
                    progressColor = "bg-violet-500"
                    textGlow = "text-violet-400"
                  }

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          {cat.category}
                          {!cat.isBudgeted && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 uppercase font-bold tracking-wider">
                              Unbudgeted
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-right">
                          <span className={`font-bold ${textGlow}`}>{symbol}{cat.spent.toFixed(2)}</span>
                          {cat.isBudgeted && (
                            <span className="text-muted-foreground"> / {symbol}{cat.limit.toFixed(2)}</span>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-accent/20 rounded-full h-2 overflow-hidden border border-border/40">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      {/* Spending Details & Alerts */}
                      <div className="flex justify-between items-center text-[11px]">
                        <div>
                          {cat.isBudgeted ? (
                            isOver ? (
                              <span className="text-rose-400 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Over budget by {symbol}{(cat.spent - cat.limit).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Remaining: {symbol}{(cat.limit - cat.spent).toFixed(2)}
                              </span>
                            )
                          ) : (
                            <span className="text-muted-foreground">Log a limit in settings</span>
                          )}
                        </div>
                        <span className="text-muted-foreground font-mono">{percent.toFixed(0)}% used</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground italic">
                No categorical spending logged for this month.
              </div>
            )}
          </GlassCard>

          {/* BILLS & INVOICES (Fixed Expenses) */}
          <GlassCard className="space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-400" />
                <h2 className="text-lg font-bold text-foreground tracking-wide">Monthly Bills & Invoices ({months[selectedMonth]})</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-accent/20 border border-border rounded-lg text-foreground font-mono text-xs">
                Total Bills: {symbol}{totalMonthlyExpenses.toFixed(2)}
              </span>
            </div>

            {fixedExpenses.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {fixedExpenses.map((exp) => {
                  const isPaid = checkIsBillPaid(exp.name, exp.category)
                  return (
                    <div 
                      key={exp.id} 
                      className={`flex justify-between items-center bg-card/40 p-3.5 rounded-xl border transition-all ${
                        isPaid ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2 text-sm">
                          {exp.name}
                          {isPaid && (
                            <span className="text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                              <Check className="w-3 h-3" /> Paid
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                          {exp.category} {exp.due_date_day ? `• Due on Day ${exp.due_date_day}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-mono text-rose-400 font-bold block text-sm">
                            {symbol}{exp.amount.toFixed(2)}
                          </span>
                        </div>
                        {!isPaid && (
                          <Button 
                            onClick={() => handleLogBillPayment(exp.name, exp.amount, exp.category)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-1.5 rounded-xl h-auto border-0 cursor-pointer"
                          >
                            Pay Bill
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground italic">
                No bills configured. Setup fixed expenses in the Finance Registry!
              </div>
            )}
          </GlassCard>

          {/* MONTHLY LEDGER (Transactions list and logger) */}
          <GlassCard className="space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-bold text-foreground tracking-wide">Transactions Ledger ({months[selectedMonth]})</h2>
              </div>
              <Button 
                onClick={() => {
                  setTxDesc("")
                  setTxAmount("")
                  setTxCategory("")
                  // Default standard day for logging in past/future month
                  const today = new Date()
                  const isCurrentMonthYear = today.getMonth() === selectedMonth && today.getFullYear() === selectedYear
                  const day = isCurrentMonthYear ? today.getDate() : 15
                  const computedDateStr = new Date(selectedYear, selectedMonth, day).toISOString().split('T')[0]
                  setTxDate(computedDateStr)
                  setIsAddTxOpen(true)
                }}
                className="bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl h-auto shadow-md shadow-violet-500/20 border-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Log Transaction
              </Button>
            </div>

            {monthlyTransactions.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {monthlyTransactions.map((t) => (
                  <div key={t.id} className="flex justify-between items-center p-3.5 bg-card/40 rounded-xl border border-border hover:border-border/80 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground text-sm">{t.description}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.category} • {t.date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-rose-400">-{symbol}{t.amount.toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this transaction?")) {
                            try {
                              await deleteTransaction.mutateAsync(t.id)
                              toast.success("Transaction deleted.")
                            } catch (err) {
                              toast.error("Failed to delete transaction.")
                            }
                          }
                        }}
                        className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground italic">
                No transactions logged for this month. Click &quot;Log Transaction&quot; or upload a receipt via the Aura AI chat!
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* DIALOG FOR LOGGING / CREATING TRANSACTIONS */}
      <Dialog open={isAddTxOpen} onOpenChange={setIsAddTxOpen}>
        <DialogContent className="sm:max-w-md bg-popover border border-border p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Receipt className="w-5 h-5 text-violet-400" /> Log New Transaction
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a spending entry to track your budget limits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddTransactionSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Description / Vendor</label>
              <Input
                type="text"
                placeholder="e.g. Starbucks, Gas Station"
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                className="bg-card border-border text-foreground"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Amount</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="bg-card border-border text-foreground font-mono"
                  min="0.01"
                  step="any"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Currency</label>
                <Select
                  value={txCurrency}
                  onValueChange={(val) => val && setTxCurrency(val)}
                >
                  <SelectTrigger className="bg-card border-border text-foreground h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground bg-popover">
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="CRC">CRC (₡)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Category</label>
                <Input
                  type="text"
                  placeholder="e.g. Food, Transport"
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="bg-card border-border text-foreground"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Transaction Date</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="bg-card border-border text-foreground font-mono"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/40 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddTxOpen(false)}
                className="border-border hover:bg-accent text-foreground border cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addTransaction.isPending}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold cursor-pointer"
              >
                {addTransaction.isPending ? "Logging..." : "Log Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
