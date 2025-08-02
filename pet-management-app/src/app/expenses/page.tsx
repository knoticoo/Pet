'use client'

import { DollarSign, Plus, Calendar, Receipt, TrendingUp, PieChart } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'
import { useAuthenticatedSession } from '@/hooks/useAuthenticatedSession'
import { useEffect, useState } from 'react'
import { t } from '@/lib/translations'

interface Expense {
  id: string
  title: string
  amount: number
  category: string
  date: string
  description?: string
  petId?: string | null
  pet?: {
    name: string
    species: string
  } | null
}

export default function ExpensesPage() {
  const { session } = useAuthenticatedSession()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchExpenses()
    }
  }, [session])

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    const now = new Date()
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
  })
  const monthlyTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'vet': return 'bg-red-100 text-red-800'
      case 'food': return 'bg-green-100 text-green-800'
      case 'toys': return 'bg-purple-100 text-purple-800'
      case 'grooming': return 'bg-blue-100 text-blue-800'
      case 'medication': return 'bg-orange-100 text-orange-800'
      case 'accessories': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vet': return '🏥'
      case 'food': return '🍖'
      case 'toys': return '🎾'
      case 'grooming': return '✂️'
      case 'medication': return '💊'
      case 'accessories': return '🦴'
      default: return '💰'
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="space-y-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">{t('common.loading')}</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('expenses.title')}</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              Отслеживайте и управляйте расходами на ваших питомцев.
            </p>
          </div>
          <Link href="/expenses/new">
            <Button className="flex items-center space-x-2 w-full md:w-auto">
              <Plus className="h-4 w-4" />
              <span>{t('expenses.addNew')}</span>
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(monthlyTotal)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-2">
              <Receipt className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold text-foreground">{expenses.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg per Month</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(expenses.length > 0 ? totalExpenses / Math.max(1, expenses.length) : 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(categoryTotals).length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Expenses by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(categoryTotals).map(([category, amount]) => (
                <div key={category} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{getCategoryIcon(category)}</span>
                  <div>
                    <p className="font-medium text-foreground capitalize">{category}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Expenses */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Expenses</h2>
          {expenses.length > 0 ? (
            <div className="space-y-4">
              {expenses.slice(0, 10).map((expense) => (
                <Link key={expense.id} href={`/expenses/${expense.id}`}>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full">
                        <span className="text-2xl">{getCategoryIcon(expense.category)}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{expense.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {expense.pet?.name || 'General'} • {formatDate(expense.date)}
                        </p>
                        {expense.description && (
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(expense.amount)}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No expenses yet</h3>
              <p className="text-muted-foreground mb-6">
                Start tracking your pet expenses to get insights into your spending.
              </p>
              <Link href="/expenses/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Expense
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}