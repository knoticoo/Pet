import { DollarSign, Plus, Calendar, Receipt, TrendingUp, PieChart } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'

export default function ExpensesPage() {
  // Sample expenses data - replace with actual data fetching
  const expenses = [
    {
      id: '1',
      title: 'Annual Vet Checkup',
      amount: 125.00,
      category: 'vet',
      date: new Date('2024-02-10'),
      description: 'Routine checkup for Buddy',
      pet: { name: 'Buddy', species: 'dog' }
    },
    {
      id: '2',
      title: 'Premium Dog Food',
      amount: 45.99,
      category: 'food',
      date: new Date('2024-02-08'),
      description: 'Royal Canin dry food 15kg',
      pet: { name: 'Buddy', species: 'dog' }
    },
    {
      id: '3',
      title: 'Cat Vaccinations',
      amount: 89.50,
      category: 'vet',
      date: new Date('2024-02-05'),
      description: 'Annual vaccinations for Whiskers',
      pet: { name: 'Whiskers', species: 'cat' }
    },
    {
      id: '4',
      title: 'Dog Toys',
      amount: 23.99,
      category: 'toys',
      date: new Date('2024-02-01'),
      description: 'Rope toy and tennis balls',
      pet: { name: 'Charlie', species: 'dog' }
    },
    {
      id: '5',
      title: 'Professional Grooming',
      amount: 65.00,
      category: 'grooming',
      date: new Date('2024-01-28'),
      description: 'Full grooming service',
      pet: { name: 'Buddy', species: 'dog' }
    }
  ]

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
      case 'accessories': return '🎀'
      default: return '📦'
    }
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Expense Tracking</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              Monitor and manage your pet-related expenses.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/expenses/reports">
              <Button variant="outline" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Reports</span>
              </Button>
            </Link>
            <Link href="/expenses/new">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Expense</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(monthlyTotal)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold text-foreground">{Object.keys(categoryTotals).length}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <PieChart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Spending by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(categoryTotals).map(([category, amount]) => (
              <div key={category} className="text-center p-4 rounded-lg bg-gray-50">
                <div className="text-2xl mb-2">{getCategoryIcon(category)}</div>
                <p className="text-sm font-medium text-foreground capitalize">{category}</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Recent Expenses</h2>
            <Link href="/expenses/reports">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getCategoryIcon(expense.category)}</div>
                  <div>
                    <h3 className="font-medium text-foreground">{expense.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {expense.pet?.name} • {formatDate(expense.date)}
                    </p>
                    {expense.description && (
                      <p className="text-xs text-muted-foreground mt-1">{expense.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(expense.amount)}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                    {expense.category}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {expenses.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No expenses recorded</h3>
              <p className="text-muted-foreground mb-6">
                Start tracking your pet expenses to better manage your budget.
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