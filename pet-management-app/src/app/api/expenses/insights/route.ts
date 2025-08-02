import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { aiVetService } from '@/lib/ai-vet-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const petId = searchParams.get('petId')
    const months = parseInt(searchParams.get('months') || '6')

    // Get user's expenses
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const whereClause: any = {
      userId: session.user.id,
      date: { gte: startDate }
    }

    if (petId && petId !== 'all') {
      whereClause.petId = petId
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        pet: {
          select: {
            name: true,
            species: true,
            breed: true,
            birthDate: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    if (expenses.length === 0) {
      return NextResponse.json({
        insights: {
          summary: 'No expenses found for analysis',
          trends: [],
          recommendations: [],
          budgetSuggestions: [],
          alerts: []
        },
        totalAnalyzed: 0
      })
    }

    // Use AI to analyze expenses
    const insights = await analyzeExpensesWithAI(expenses, months)

    return NextResponse.json({
      insights,
      totalAnalyzed: expenses.length,
      dateRange: {
        from: startDate.toISOString(),
        to: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error generating expense insights:', error)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}

async function analyzeExpensesWithAI(expenses: any[], months: number) {
  try {
    const endpoint = await aiVetService.findWorkingEndpoint()
    if (!endpoint) {
      return getFallbackInsights(expenses)
    }

    // Prepare expense data for AI analysis
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const avgMonthly = totalAmount / months
    
    const categories = expenses.reduce((acc: any, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount
      return acc
    }, {})

    const topCategories = Object.entries(categories)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([cat, amount]) => `${cat}: $${amount}`)
      .join(', ')

    const recentExpenses = expenses.slice(0, 10)
      .map(exp => `$${exp.amount} - ${exp.category} - ${exp.title}`)
      .join('; ')

    const prompt = `Pet Expense Analysis - Financial Advisor AI

Total spent: $${totalAmount} over ${months} months (avg $${avgMonthly.toFixed(2)}/month)
Top categories: ${topCategories}
Recent expenses: ${recentExpenses}

Analyze and respond in exact format:
SUMMARY: [Brief overview of spending patterns]
TRENDS: [trend1], [trend2], [trend3]
RECOMMENDATIONS: [tip1], [tip2], [tip3]
BUDGET: [budget suggestion1], [budget suggestion2]
ALERTS: [concern1], [concern2]

Focus on practical pet care budgeting advice and cost optimization.`

    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.9,
          num_predict: 300,
          num_ctx: 1024
        }
      }),
      timeout: 15000
    } as any)

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    return parseExpenseInsights(data.response)
  } catch (error) {
    console.error('AI expense analysis failed:', error)
    return getFallbackInsights(expenses)
  }
}

function parseExpenseInsights(response: string) {
  const lines = response.split('\n')
  const insights: any = {}

  lines.forEach(line => {
    const cleanLine = line.trim()
    
    if (cleanLine.startsWith('SUMMARY:')) {
      insights.summary = cleanLine.split(':')[1].trim()
    } else if (cleanLine.startsWith('TRENDS:')) {
      insights.trends = cleanLine.split(':')[1].split(',').map(t => t.trim()).filter(t => t)
    } else if (cleanLine.startsWith('RECOMMENDATIONS:')) {
      insights.recommendations = cleanLine.split(':')[1].split(',').map(r => r.trim()).filter(r => r)
    } else if (cleanLine.startsWith('BUDGET:')) {
      insights.budgetSuggestions = cleanLine.split(':')[1].split(',').map(b => b.trim()).filter(b => b)
    } else if (cleanLine.startsWith('ALERTS:')) {
      insights.alerts = cleanLine.split(':')[1].split(',').map(a => a.trim()).filter(a => a)
    }
  })

  return {
    summary: insights.summary || 'Expense analysis completed',
    trends: insights.trends || ['Regular spending pattern observed'],
    recommendations: insights.recommendations || ['Monitor recurring expenses', 'Budget for unexpected vet visits'],
    budgetSuggestions: insights.budgetSuggestions || ['Set monthly pet care budget', 'Emergency fund recommended'],
    alerts: insights.alerts || []
  }
}

function getFallbackInsights(expenses: any[]) {
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const avgMonthly = totalAmount / 6
  
  const categories = expenses.reduce((acc: any, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {})

  const topCategory = Object.entries(categories)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]

  return {
    summary: `You've spent $${totalAmount.toFixed(2)} on pet care over the analyzed period, averaging $${avgMonthly.toFixed(2)} per month.`,
    trends: [
      `${topCategory[0]} is your highest expense category at $${topCategory[1]}`,
      'Regular monthly pattern observed',
      'Most expenses occur during routine care periods'
    ],
    recommendations: [
      'Consider setting up a monthly pet care budget',
      'Look for bulk buying opportunities for food and supplies',
      'Regular preventive care can reduce emergency costs'
    ],
    budgetSuggestions: [
      `Budget approximately $${(avgMonthly * 1.2).toFixed(2)}/month for pet expenses`,
      'Maintain an emergency fund for unexpected vet visits'
    ],
    alerts: avgMonthly > 200 ? ['High monthly spending detected - consider reviewing recurring expenses'] : []
  }
}