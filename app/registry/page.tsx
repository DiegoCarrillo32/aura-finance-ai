'use client'

import { FinanceRegistry } from '@/components/finance-registry'

export default function RegistryPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-wide">Finance Registry</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your active income streams, fixed expenses, and categorical budgets</p>
      </div>
      <FinanceRegistry />
    </div>
  )
}
