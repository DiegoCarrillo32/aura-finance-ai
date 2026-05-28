'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface Profile {
  id: string
  full_name: string | null
  currency: string
  hourly_rate: number
  hourly_rate_type: 'manual' | 'auto'
  updated_at: string
  exchange_rate: number
}

export interface Income {
  id: string
  user_id: string
  amount: number
  source: string
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'one_time'
  start_date: string
  description: string | null
  created_at: string
}

export interface FixedExpense {
  id: string
  user_id: string
  amount: number
  name: string
  category: string
  due_date_day: number | null
  frequency: 'monthly' | 'yearly'
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category: string
  limit_amount: number
  period: 'monthly'
  created_at: string
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string
  status: 'active' | 'completed' | 'paused'
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  amount: number
  description: string
  category: string
  date: string
  created_at: string
}

export interface Installment {
  id: string
  user_id: string
  name: string
  monthly_amount: number
  total_amount: number | null
  total_installments: number
  installments_paid: number
  start_date: string
  created_at: string
}

// ------------------ PROFILE ------------------

export function useProfile() {
  return useQuery<Profile | null>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // If profile doesn't exist yet, insert a default one
        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || 'Guest User',
            currency: 'USD',
            hourly_rate: 0,
            hourly_rate_type: 'auto',
          })
          .select('*')
          .single()

        if (insertError) throw insertError
        return {
          ...inserted,
          exchange_rate: user.user_metadata?.exchange_rate || 515
        }
      }
      return {
        ...data,
        exchange_rate: user.user_metadata?.exchange_rate || 515
      }
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Partial<Omit<Profile, 'id' | 'updated_at'>>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { exchange_rate, ...profileUpdates } = updates

      // If exchange_rate is provided, update user_metadata in Supabase Auth
      if (exchange_rate !== undefined) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { exchange_rate }
        })
        if (authError) throw authError
      }

      // Update profiles table
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('*')
        .single()

      if (error) throw error
      return {
        ...data,
        exchange_rate: exchange_rate !== undefined ? exchange_rate : (user.user_metadata?.exchange_rate || 515)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

// ------------------ INCOMES ------------------

export function useIncomes() {
  return useQuery<Income[]>({
    queryKey: ['incomes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

export function useAddIncome() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (income: Omit<Income, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('incomes')
        .insert({ ...income, user_id: user.id })
        .select('*')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] }) // to re-calculate auto hourly rate
    },
  })
}

export function useDeleteIncome() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

// ------------------ FIXED EXPENSES ------------------

export function useFixedExpenses() {
  return useQuery<FixedExpense[]>({
    queryKey: ['fixed_expenses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

export function useAddFixedExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (expense: Omit<FixedExpense, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('fixed_expenses')
        .insert({ ...expense, user_id: user.id })
        .select('*')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] })
    },
  })
}

export function useDeleteFixedExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fixed_expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] })
    },
  })
}

// ------------------ BUDGETS ------------------

export function useBudgets() {
  return useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

export function useAddBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (budget: Omit<Budget, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('budgets')
        .upsert(
          { ...budget, user_id: user.id },
          { onConflict: 'user_id, category' }
        )
        .select('*')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

// ------------------ SAVINGS GOALS ------------------

export function useSavingsGoals() {
  return useQuery<SavingsGoal[]>({
    queryKey: ['savings_goals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

export function useAddSavingsGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('savings_goals')
        .insert({ ...goal, user_id: user.id })
        .select('*')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] })
    },
  })
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Partial<SavingsGoal> & { id: string }) => {
      const { id, ...dataToUpdate } = updates
      const { data, error } = await supabase
        .from('savings_goals')
        .update(dataToUpdate)
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] })
    },
  })
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] })
    },
  })
}

// ------------------ TRANSACTIONS ------------------

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

export function useAddTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...transaction, user_id: user.id })
        .select('*')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

// ------------------ INSTALLMENTS ------------------

export function useInstallments() {
  return useQuery<Installment[]>({
    queryKey: ['installments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

export function useAddInstallment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (installment: Omit<Installment, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('installments')
        .insert({ ...installment, user_id: user.id })
        .select('*')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] })
    },
  })
}

export function useUpdateInstallment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Partial<Installment> & { id: string }) => {
      const { id, ...dataToUpdate } = updates
      const { data, error } = await supabase
        .from('installments')
        .update(dataToUpdate)
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] })
    },
  })
}

export function useDeleteInstallment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('installments')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] })
    },
  })
}
