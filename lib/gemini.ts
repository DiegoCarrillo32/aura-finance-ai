import { GoogleGenerativeAI, Tool, SchemaType } from '@google/generative-ai'

// Initialize the Google Generative AI client
const apiKey = process.env.GEMINI_API_KEY || ''
export const genAI = new GoogleGenerativeAI(apiKey)

export const SYSTEM_INSTRUCTION = `
You are Aura, an elite AI financial advisor. Your role is to help the user manage their personal finances, design budgets, review savings options, and make smart purchasing decisions.

You are context-aware: you will be provided with a complete read-only snapshot of the user's financial profile, including their hourly worth, current incomes, fixed bills, discretionary category budgets, and savings goals.

RULES FOR ADVICE:
1. Always evaluate purchasing questions (e.g., "Can I buy a $500 iPad?") against their:
   - Monthly net cashflow (Total Income - Fixed Expenses - Budget Limits).
   - Impelled labor cost (Price / Hourly rate). Explain: "This item represents X hours of your labor."
   - Current active savings goals. Warn them if buying it today compromises their goals.
2. Keep your answers concise, practical, and visually polished (using markdown lists, bold text, and currency formatting).

RULES FOR ACTIONS (Tool Calling):
1. If the user expresses intent to buy/save for something, call 'propose_savings_goal'.
2. If the user wants to add/register a monthly bill or subscription, call 'propose_fixed_expense'.
3. If the user mentions a new income stream or rate change, call 'propose_income'.
4. If the user wants to define or update a spending budget cap, call 'propose_budget'.
5. If the user uploads a receipt image or mentions a specific purchase, call 'propose_transaction' to log the transaction against their budget.
6. If the user mentions buying something on installments, financing, or tracking a loan, call 'propose_installment'.
7. Important: Your tool calls do NOT write directly to the database. They generate interactive draft cards in the chat. Tell the user they can review and approve the draft card you've generated in the chat window.

SPECIAL INSTRUCTIONS FOR RECEIPTS:
- The user's currency is Costa Rican Colones (CRC, ₡).
- When parsing uploaded receipts, look for CRC formatting (e.g., 1.000,00 or 1,000.00). Ensure the final amount you propose is a plain numeric value (e.g., 1000.00).
- Try to infer the budget category from the receipt's vendor or items.
`

export const FINANCIAL_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'propose_savings_goal',
        description: 'Propose a new savings goal for the user to confirm.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            name: {
              type: SchemaType.STRING,
              description: 'The name of the item or purpose of saving (e.g. New iPad, Laptop, Vacation Fund)',
            },
            target_amount: {
              type: SchemaType.NUMBER,
              description: 'The total target amount of money to save (numeric)',
            },
            target_date: {
              type: SchemaType.STRING,
              description: 'Target date to reach the goal in YYYY-MM-DD format',
            },
          },
          required: ['name', 'target_amount', 'target_date'],
        },
      },
      {
        name: 'propose_fixed_expense',
        description: 'Propose adding a fixed recurring monthly expense or bill.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            name: {
              type: SchemaType.STRING,
              description: 'Name of the bill or subscription (e.g., Netflix, Rent, Electricity)',
            },
            amount: {
              type: SchemaType.NUMBER,
              description: 'Monthly cost (numeric)',
            },
            category: {
              type: SchemaType.STRING,
              description: 'General category (e.g. Housing, Utilities, Subscriptions, Insurance)',
            },
            due_date_day: {
              type: SchemaType.INTEGER,
              description: 'Day of the month the bill is due (1 to 31)',
            },
          },
          required: ['name', 'amount', 'category'],
        },
      },
      {
        name: 'propose_income',
        description: 'Propose adding a recurring income stream.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            source: {
              type: SchemaType.STRING,
              description: 'Source of the income (e.g. Salary, Freelance Gig, Rent Revenue)',
            },
            amount: {
              type: SchemaType.NUMBER,
              description: 'Amount of income (numeric)',
            },
            frequency: {
              type: SchemaType.STRING,
              description: 'Frequency of receipt (weekly, biweekly, monthly, or one_time)',
            },
          },
          required: ['source', 'amount', 'frequency'],
        },
      },
      {
        name: 'propose_budget',
        description: 'Propose creating or updating a discretionary category monthly budget cap.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            category: {
              type: SchemaType.STRING,
              description: 'Category name (e.g. Food, Dining Out, Entertainment, Gasoline)',
            },
            limit_amount: {
              type: SchemaType.NUMBER,
              description: 'Maximum monthly budget cap amount (numeric)',
            },
          },
          required: ['category', 'limit_amount'],
        },
      },
      {
        name: 'propose_transaction',
        description: 'Propose logging a specific expenditure or transaction against a budget.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            description: {
              type: SchemaType.STRING,
              description: "Description of the transaction or vendor (e.g., Trader Joe's, Uber, Amazon)",
            },
            amount: {
              type: SchemaType.NUMBER,
              description: 'Total amount spent (numeric, parsed correctly from CRC)',
            },
            category: {
              type: SchemaType.STRING,
              description: 'Inferred budget category (e.g., Food, Transportation, Entertainment)',
            },
          },
          required: ['description', 'amount', 'category'],
        },
      },
      {
        name: 'propose_installment',
        description: 'Propose tracking a new fixed-term installment plan (e.g. loan, financing).',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            name: {
              type: SchemaType.STRING,
              description: 'Name of the item or loan (e.g., iPhone 15 Pro, Car Loan)',
            },
            monthly_amount: {
              type: SchemaType.NUMBER,
              description: 'Amount paid each month (numeric)',
            },
            total_amount: {
              type: SchemaType.NUMBER,
              description: 'Total cost of the loan or item (numeric)',
            },
            total_installments: {
              type: SchemaType.INTEGER,
              description: 'Total number of months the plan lasts (numeric)',
            },
            installments_paid: {
              type: SchemaType.INTEGER,
              description: 'Number of months already paid off (numeric, usually 0 if new)',
            },
            start_date: {
              type: SchemaType.STRING,
              description: 'Start date in YYYY-MM-DD format',
            },
          },
          required: ['name', 'monthly_amount', 'total_amount', 'total_installments', 'installments_paid', 'start_date'],
        },
      },
    ],
  },
]
