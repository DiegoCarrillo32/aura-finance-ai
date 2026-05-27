'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useAddSavingsGoal,
  useAddFixedExpense,
  useAddIncome,
  useAddBudget,
  useProfile
} from '@/hooks/use-financials'
import { MessageSquare, X, Send, Sparkles, Check, Trash } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  actionPayload?: {
    type: string
    data: Record<string, string>
  } | null
  actionExecuted?: boolean
  actionRejected?: boolean
}

export function ChatDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am Aura, your financial co-pilot. I can help analyze your spending, calculate purchase requirements, or automate tracking. Try saying: *'I want to save $500 for a trip by December'* or *'Add my internet bill of $60 monthly'*.",
    },
  ])
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mutations
  const addSavingsGoal = useAddSavingsGoal()
  const addFixedExpense = useAddFixedExpense()
  const addIncome = useAddIncome()
  const addBudget = useAddBudget()
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          actionPayload: data.actionPayload,
          actionExecuted: false,
          actionRejected: false,
        },
      ])
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to send message')
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error communicating with my brain core. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Execute Gemini tool recommendation
  const handleExecuteAction = async (msgId: string, payload: { type: string; data: Record<string, string> }) => {
    try {
      if (payload.type === 'propose_savings_goal') {
        const { name, target_amount, target_date } = payload.data
        await addSavingsGoal.mutateAsync({
          name,
          target_amount: parseFloat(target_amount),
          current_amount: 0,
          target_date,
          status: 'active',
        })
        toast.success(`Savings goal "${name}" created!`)
      } else if (payload.type === 'propose_fixed_expense') {
        const { name, amount, category, due_date_day } = payload.data
        await addFixedExpense.mutateAsync({
          name,
          amount: parseFloat(amount),
          category,
          due_date_day: due_date_day ? parseInt(due_date_day) : null,
          frequency: 'monthly',
        })
        toast.success(`Fixed expense "${name}" added!`)
      } else if (payload.type === 'propose_income') {
        const { source, amount, frequency } = payload.data
        await addIncome.mutateAsync({
          source,
          amount: parseFloat(amount),
          frequency: frequency as 'weekly' | 'biweekly' | 'monthly' | 'one_time',
          start_date: new Date().toISOString().split('T')[0],
          description: null,
        })
        toast.success(`Income stream "${source}" added!`)
      } else if (payload.type === 'propose_budget') {
        const { category, limit_amount } = payload.data
        await addBudget.mutateAsync({
          category,
          limit_amount: parseFloat(limit_amount),
          period: 'monthly',
        })
        toast.success(`Budget cap for "${category}" set to $${limit_amount}!`)
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, actionExecuted: true } : m))
      )
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to complete database operation')
    }
  }

  const handleRejectAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, actionRejected: true } : m))
    )
    toast.info('Action cancelled.')
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all z-40 border border-violet-500/20 group"
      >
        <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-transform" />
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-card/60 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-background border-l border-border shadow-2xl z-50 flex flex-col transition-all duration-300 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <div>
              <h3 className="font-bold text-foreground tracking-wide">Aura AI Co-Pilot</h3>
              <p className="text-[10px] text-muted-foreground font-medium">Context-Aware Advisory & Actions</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Message Logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-none font-medium'
                    : 'bg-card text-foreground border border-border rounded-bl-none'
                }`}
              >
                <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*(.*?)\*/g, '<em>$1</em>') }} />

                {/* Render interactive confirmation card if tool triggered */}
                {msg.actionPayload && (
                  <div className="mt-3 p-3 bg-card rounded-xl border border-border space-y-2.5">
                    <p className="text-[10px] text-violet-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Proposed Action
                    </p>

                    <div className="text-xs space-y-1 text-foreground">
                      {msg.actionPayload.type === 'propose_savings_goal' && (
                        <>
                          <div className="font-semibold text-foreground">Create Savings Goal</div>
                          <div>Goal: <span className="font-medium text-slate-100">{msg.actionPayload.data.name}</span></div>
                          <div>Target: <span className="font-mono text-emerald-400 font-bold">{symbol}{msg.actionPayload.data.target_amount}</span></div>
                          <div>Target Date: <span className="font-medium text-slate-100">{msg.actionPayload.data.target_date}</span></div>
                        </>
                      )}

                      {msg.actionPayload.type === 'propose_fixed_expense' && (
                        <>
                          <div className="font-semibold text-foreground">Add Fixed Expense</div>
                          <div>Name: <span className="font-medium text-slate-100">{msg.actionPayload.data.name}</span></div>
                          <div>Amount: <span className="font-mono text-rose-400 font-bold">{symbol}{msg.actionPayload.data.amount}/mo</span></div>
                          <div>Category: <span className="font-medium text-slate-100">{msg.actionPayload.data.category}</span></div>
                          {msg.actionPayload.data.due_date_day && (
                            <div>Due day: <span className="font-mono text-slate-100">{msg.actionPayload.data.due_date_day}</span></div>
                          )}
                        </>
                      )}

                      {msg.actionPayload.type === 'propose_income' && (
                        <>
                          <div className="font-semibold text-foreground">Register Income Stream</div>
                          <div>Source: <span className="font-medium text-slate-100">{msg.actionPayload.data.source}</span></div>
                          <div>Amount: <span className="font-mono text-emerald-400 font-bold">{symbol}{msg.actionPayload.data.amount}</span></div>
                          <div className="capitalize">Frequency: <span className="font-medium text-slate-100">{msg.actionPayload.data.frequency}</span></div>
                        </>
                      )}

                      {msg.actionPayload.type === 'propose_budget' && (
                        <>
                          <div className="font-semibold text-foreground">Set Category Budget Cap</div>
                          <div className="capitalize">Category: <span className="font-medium text-slate-100">{msg.actionPayload.data.category}</span></div>
                          <div>Limit Amount: <span className="font-mono text-amber-400 font-bold">{symbol}{msg.actionPayload.data.limit_amount}/mo</span></div>
                        </>
                      )}
                    </div>

                    {!msg.actionExecuted && !msg.actionRejected ? (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => msg.actionPayload && handleExecuteAction(msg.id, msg.actionPayload)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 flex-grow flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRejectAction(msg.id)}
                          className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 text-xs h-8"
                        >
                          Dismiss
                        </Button>
                      </div>
                    ) : msg.actionExecuted ? (
                      <div className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 text-center">
                        ✓ Action Executed and Database Updated!
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground italic bg-white/[0.02] px-2 py-1 rounded border border-border text-center">
                        Dismissed
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs italic bg-card p-2.5 rounded-xl border border-border w-24">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-violet-400" /> Aura is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card/30 flex gap-2">
          <Input
            type="text"
            placeholder="Ask Aura a financial question..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-grow bg-card border-border text-foreground placeholder-slate-500"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/15"
            disabled={isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </>
  )
}
