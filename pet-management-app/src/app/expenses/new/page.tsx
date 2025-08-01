'use client'

import { useState, useEffect } from 'react'
import { DollarSign, ArrowLeft, Receipt, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Pet {
  id: string
  name: string
  species: string
}

export default function NewExpensePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchPets()
    }
  }, [session])

  const fetchPets = async () => {
    try {
      const response = await fetch('/api/pets')
      if (response.ok) {
        const data = await response.json()
        setPets(data)
      }
    } catch (error) {
      console.error('Error fetching pets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    const expenseData = {
      title: formData.get('title'),
      amount: formData.get('amount'),
      date: formData.get('date'),
      category: formData.get('category'),
      petId: formData.get('petId') || null,
      description: formData.get('description'),
    }
    
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      })

      if (response.ok) {
        // Successfully created expense, redirect to expenses page
        router.push('/expenses')
      } else {
        const errorData = await response.json()
        console.error('Error creating expense:', errorData)
        alert('Failed to create expense. Please try again.')
      }
    } catch (error) {
      console.error('Error creating expense:', error)
      alert('Failed to create expense. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileSelect = () => {
    const fileInput = document.getElementById('receipt') as HTMLInputElement
    fileInput?.click()
  }

  return (
    <AuthGuard>
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/expenses">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Expenses
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Add New Expense</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Record a new pet-related expense.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                  Expense Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g., Vet Visit, Dog Food, Grooming"
                />
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    step="0.01"
                    min="0"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select category</option>
                  <option value="vet">🏥 Veterinary Care</option>
                  <option value="food">🍖 Food & Treats</option>
                  <option value="toys">🎾 Toys & Entertainment</option>
                  <option value="grooming">✂️ Grooming</option>
                  <option value="medication">💊 Medication</option>
                  <option value="accessories">🎀 Accessories</option>
                  <option value="training">🎓 Training</option>
                  <option value="boarding">🏠 Boarding/Pet Sitting</option>
                  <option value="insurance">🛡️ Insurance</option>
                  <option value="other">📦 Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="pet" className="block text-sm font-medium text-foreground mb-2">
                  Pet (Optional)
                </label>
                <select
                  id="pet"
                  name="petId"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">General/Multiple Pets</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Additional details about this expense..."
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="receipt" className="block text-sm font-medium text-foreground mb-2">
                  Receipt/Photo (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drop a receipt image here, or click to browse
                  </p>
                  <input
                    type="file"
                    id="receipt"
                    name="receipt"
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFileSelect}
                  >
                    Choose File
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                <DollarSign className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Adding...' : 'Add Expense'}
              </Button>
              <Link href="/expenses" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>

        {/* Quick Tips */}
        <div className="card p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-3">💡 Expense Tracking Tips</h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-start space-x-2">
              <Receipt className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Keep receipts for tax deductions and warranty claims</span>
            </li>
            <li className="flex items-start space-x-2">
              <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Record expenses regularly to maintain accurate budgets</span>
            </li>
            <li className="flex items-start space-x-2">
              <DollarSign className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Categorize expenses to identify spending patterns</span>
            </li>
          </ul>
        </div>
      </div>
    </AuthGuard>
  )
}