'use client'

import { Calculator } from '@/components/calculator'

export default function CalculatorPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-wide">Work & Purchase Calculator</h1>
        <p className="text-sm text-muted-foreground mt-1">Determine how much labor is required to afford your next purchase</p>
      </div>
      <Calculator />
    </div>
  )
}
