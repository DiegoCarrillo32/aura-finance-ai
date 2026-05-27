import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { genAI, SYSTEM_INSTRUCTION, FINANCIAL_TOOLS } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const { messages, imageBase64, imageMimeType } = await req.json()
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
    }

    // Initialize Supabase Server Client
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's financial snapshot from Supabase Cloud
    const [profileRes, incomesRes, expensesRes, budgetsRes, goalsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('incomes').select('*').eq('user_id', user.id),
      supabase.from('fixed_expenses').select('*').eq('user_id', user.id),
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('savings_goals').select('*').eq('user_id', user.id),
    ])

    const totalIncome = (incomesRes.data || []).reduce((sum, inc) => {
      let amt = inc.amount
      if (inc.frequency === 'weekly') amt *= 4.33
      else if (inc.frequency === 'biweekly') amt *= 2.16
      else if (inc.frequency === 'one_time') return sum
      return sum + amt
    }, 0)

    const impliedHourlyRate = totalIncome > 0 ? totalIncome / 160 : 0
    const activeHourlyRate = profileRes.data?.hourly_rate_type === 'auto'
      ? impliedHourlyRate
      : (profileRes.data?.hourly_rate || 0)

    const snapshot = {
      profile: {
        currency: profileRes.data?.currency || 'USD',
        hourly_rate: activeHourlyRate,
        hourly_rate_type: profileRes.data?.hourly_rate_type || 'auto'
      },
      incomes: incomesRes.data || [],
      fixed_expenses: expensesRes.data || [],
      budgets: budgetsRes.data || [],
      savings_goals: goalsRes.data || [],
    }

    // Compile dynamic context into system instruction
    const compiledInstruction = `
${SYSTEM_INSTRUCTION}

=== USER FINANCIAL STATUS SNAPSHOT ===
${JSON.stringify(snapshot, null, 2)}
=======================================
`

    // Configure Gemini Generative Model
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: compiledInstruction,
      tools: FINANCIAL_TOOLS,
    })

    // Map history to Gemini API expected format and strictly enforce user/model alternation
    const mappedHistory = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    // 1. History must start with a 'user' role
    while (mappedHistory.length > 0 && mappedHistory[0].role !== 'user') {
      mappedHistory.shift()
    }

    // 2. Roles must strictly alternate (user -> model -> user -> model)
    const geminiHistory = []
    let expectedRole = 'user'
    for (const msg of mappedHistory) {
      if (msg.role === expectedRole) {
        geminiHistory.push(msg)
        expectedRole = expectedRole === 'user' ? 'model' : 'user'
      }
    }

    const activeMessage = messages[messages.length - 1].content

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: Array<any> = [{ text: activeMessage }]
    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType,
        },
      })
    }

    const chat = model.startChat({
      history: geminiHistory,
    })

    const responseResult = await chat.sendMessage(parts)
    const responseText = responseResult.response.text()

    // Capture Gemini function calling payloads
    const functionCalls = responseResult.response.functionCalls()
    let actionPayload = null

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0]
      actionPayload = {
        type: call.name,
        data: call.args,
      }
    }

    return NextResponse.json({
      content: responseText,
      actionPayload,
    })
  } catch (error: unknown) {
    console.error('Gemini Chat API Error:', error)
    return NextResponse.json(
      { error: (error as Error)?.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
