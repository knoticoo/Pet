'use client'

import { useState, useEffect } from 'react'
import { DollarSign, ArrowLeft, Receipt, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'
import { useRouter } from 'next/navigation'
import { useAuthenticatedSession } from '@/hooks/useAuthenticatedSession'
import { Sparkles, Brain } from 'lucide-react'

interface Pet {
  id: string
  name: string
  species: string
}

export default function NewExpensePage() {
  const { session } = useAuthenticatedSession()
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<{
    category: string
    confidence: number
    suggestions: string[]
  } | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    petId: '',
    description: ''
  })

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
    }
  }

  const getAISuggestions = async (title: string, description: string) => {
    if (!title && !description) return

    setAiSuggesting(true)
    try {
      const response = await fetch('/api/ai/expense-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          description,
          petSpecies: pets.find(p => p.id === formData.petId)?.species 
        })
      })

      if (response.ok) {
        const suggestions = await response.json()
        setAiSuggestions(suggestions)
        
        // Auto-apply high confidence suggestions
        if (suggestions.confidence > 0.8 && suggestions.category) {
          setFormData(prev => ({ ...prev, category: suggestions.category }))
        }
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error)
    } finally {
      setAiSuggesting(false)
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, title: value }))
    
    // Debounce AI suggestions
    clearTimeout(window.aiSuggestionTimeout)
    window.aiSuggestionTimeout = setTimeout(() => {
      getAISuggestions(value, formData.description)
    }, 1000)
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, description: value }))
    
    // Debounce AI suggestions
    clearTimeout(window.aiSuggestionTimeout)
    window.aiSuggestionTimeout = setTimeout(() => {
      getAISuggestions(formData.title, value)
    }, 1000)
  }

  const applySuggestion = (suggestion: string) => {
    if (suggestion.includes('category:')) {
      const category = suggestion.split('category:')[1].trim()
      setFormData(prev => ({ ...prev, category }))
    } else if (suggestion.includes('title:')) {
      const title = suggestion.split('title:')[1].trim()
      setFormData(prev => ({ ...prev, title }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    
    const expenseData = {
      title: formData.title,
      amount: formData.amount,
      date: new Date().toISOString().split('T')[0], // Keep original date logic
      category: formData.category,
      petId: formData.petId || null,
      description: formData.description,
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
      setSubmitting(false)
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

        {/* AI Suggestions Panel */}
        {(aiSuggesting || aiSuggestions) && (
          <div className="card p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              {aiSuggesting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              ) : (
                <Brain className="h-4 w-4 text-purple-600" />
              )}
              <span className="text-sm font-medium text-purple-800">
                {aiSuggesting ? 'AI is analyzing...' : 'AI Suggestions'}
              </span>
            </div>
            
            {aiSuggestions && !aiSuggesting && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-purple-700">
                    Suggested category: <strong>{aiSuggestions.category}</strong>
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                    {Math.round(aiSuggestions.confidence * 100)}% confident
                  </span>
                </div>
                
                {aiSuggestions.suggestions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-purple-600">Smart suggestions:</span>
                    <div className="flex flex-wrap gap-1">
                      {aiSuggestions.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => applySuggestion(suggestion)}
                          className="text-xs bg-white text-purple-700 border border-purple-200 px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                  Expense Title *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    required
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g., Vet Visit, Dog Food, Grooming"
                  />
                  {aiSuggesting && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                    </div>
                  )}
                </div>
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
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
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
                  value={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
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
                  value={formData.petId}
                  onChange={(e) => setFormData(prev => ({ ...prev, petId: e.target.value }))}
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
                  value={formData.description}
                  onChange={handleDescriptionChange}
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
              <Button type="submit" className="flex-1" disabled={submitting}>
                <DollarSign className="h-4 w-4 mr-2" />
                {submitting ? 'Adding...' : 'Add Expense'}
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

// Extend Window interface for TypeScript
declare global {
  interface Window {
    aiSuggestionTimeout: NodeJS.Timeout
  }
}