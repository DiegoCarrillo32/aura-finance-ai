import { render, screen, fireEvent } from '@testing-library/react'
import { Calculator } from '@/components/calculator'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as hooks from '@/hooks/use-financials'

vi.mock('@/hooks/use-financials', () => ({
  useProfile: vi.fn(),
  useIncomes: vi.fn(),
  useFixedExpenses: vi.fn(),
  useBudgets: vi.fn(),
  useAddSavingsGoal: vi.fn(),
}))

describe('Calculator Component', () => {
  const mockMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    vi.mocked(hooks.useProfile).mockReturnValue({ data: { currency: 'USD', hourly_rate_type: 'auto' } } as unknown as ReturnType<typeof hooks.useProfile>);
    vi.mocked(hooks.useIncomes).mockReturnValue({ data: [{ amount: 4000, frequency: 'monthly' }] } as unknown as ReturnType<typeof hooks.useIncomes>);
    vi.mocked(hooks.useFixedExpenses).mockReturnValue({ data: [{ amount: 1000, frequency: 'monthly' }] } as unknown as ReturnType<typeof hooks.useFixedExpenses>);
    vi.mocked(hooks.useBudgets).mockReturnValue({ data: [{ limit_amount: 500 }] } as unknown as ReturnType<typeof hooks.useBudgets>);
    vi.mocked(hooks.useAddSavingsGoal).mockReturnValue({ mutateAsync: mockMutateAsync } as unknown as ReturnType<typeof hooks.useAddSavingsGoal>);
  })

  it('renders correctly', () => {
    render(<Calculator />)
    expect(screen.getByText('Work & Purchase Calculator')).toBeInTheDocument()
    expect(screen.getByText('What do you want to buy?')).toBeInTheDocument()
  })

  it('calculates hourly rate and labor equivalency automatically', () => {
    render(<Calculator />)
    
    // Income = 4000, Expenses = 1000, Budgets = 500 -> Leftover = 2500
    // Auto Hourly rate = 4000 / 160 = 25
    
    const priceInput = screen.getByPlaceholderText('0.00')
    fireEvent.change(priceInput, { target: { value: '500' } })
    
    // Labor equivalency: 500 / 25 = 20 hrs
    expect(screen.getByText('20.0 hrs')).toBeInTheDocument()
    
    // Savings duration: daily savings = 2500 / 30.4 = 82.236
    // Days needed: 500 / 82.236 = 6.08
    expect(screen.getByText('6.1 days')).toBeInTheDocument()
  })

  it('calculates properly with manual hourly rate', () => {
    vi.mocked(hooks.useProfile).mockReturnValue({ data: { currency: 'USD', hourly_rate_type: 'manual', hourly_rate: 50 } } as unknown as ReturnType<typeof hooks.useProfile>);
    
    render(<Calculator />)
    
    const priceInput = screen.getByPlaceholderText('0.00')
    fireEvent.change(priceInput, { target: { value: '500' } })
    
    // Labor equivalency: 500 / 50 = 10 hrs
    expect(screen.getByText('10.0 hrs')).toBeInTheDocument()
  })
})
