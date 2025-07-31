'use client'

import { useState, useEffect } from 'react'
import { Bell, ArrowLeft, Calendar, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'
import { useRouter } from 'next/navigation'

interface Pet {
  id: string
  name: string
  species: string
  breed?: string
}

export default function NewReminderPage() {
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPets()
  }, [])

  const fetchPets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pets')
      if (response.ok) {
        const data = await response.json()
        setPets(data)
      } else {
        setError('Failed to fetch pets')
      }
    } catch (error) {
      setError('An error occurred while fetching pets')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    const dueDate = formData.get('dueDate') as string
    const dueTime = formData.get('dueTime') as string
    
    // Combine date and time
    const combinedDateTime = dueTime 
      ? `${dueDate}T${dueTime}:00`
      : `${dueDate}T09:00:00`
    
    const reminderData = {
      petId: formData.get('petId'),
      title: formData.get('title'),
      description: formData.get('description'),
      dueDate: combinedDateTime,
      reminderType: formData.get('reminderType'),
      notifyBefore: formData.get('notifyBefore') || '24',
    }
    
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData),
      })
      
      if (response.ok) {
        router.push('/reminders')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create reminder')
      }
    } catch (error) {
      setError('An error occurred while creating reminder')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillTemplate = (title: string, type: string, description: string) => {
    const titleInput = document.getElementById('title') as HTMLInputElement
    const typeSelect = document.getElementById('reminderType') as HTMLSelectElement
    const descInput = document.getElementById('description') as HTMLTextAreaElement
    
    if (titleInput) titleInput.value = title
    if (typeSelect) typeSelect.value = type
    if (descInput) descInput.value = description
  }

  return (
    <AuthGuard>
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/reminders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reminders
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Create Reminder</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Set up an automated reminder for your pet's care.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="pet" className="block text-sm font-medium text-foreground mb-2">
                  Select Pet *
                </label>
                <select
                  id="pet"
                  name="petId"
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">Choose a pet</option>
                  {pets.map(pet => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.breed ? `${pet.breed} ` : ''}{pet.species})
                    </option>
                  ))}
                </select>
                {pets.length === 0 && !loading && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No pets found. <Link href="/pets/new" className="text-primary hover:underline">Add a pet first</Link>.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                  Reminder Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g., Annual Vaccination, Monthly Heartworm Medication"
                />
              </div>

              <div>
                <label htmlFor="reminderType" className="block text-sm font-medium text-foreground mb-2">
                  Reminder Type *
                </label>
                <select
                  id="reminderType"
                  name="reminderType"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select type</option>
                  <option value="vaccination">💉 Vaccination</option>
                  <option value="medication">💊 Medication</option>
                  <option value="appointment">🏥 Appointment</option>
                  <option value="grooming">✂️ Grooming</option>
                  <option value="feeding">🍖 Feeding</option>
                  <option value="exercise">🏃 Exercise</option>
                  <option value="checkup">🩺 Health Checkup</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="notifyBefore" className="block text-sm font-medium text-foreground mb-2">
                  Notify Before
                </label>
                <select
                  id="notifyBefore"
                  name="notifyBefore"
                  defaultValue="24"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="1">1 hour before</option>
                  <option value="6">6 hours before</option>
                  <option value="24">1 day before</option>
                  <option value="48">2 days before</option>
                  <option value="72">3 days before</option>
                  <option value="168">1 week before</option>
                </select>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-foreground mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="dueTime" className="block text-sm font-medium text-foreground mb-2">
                  Due Time
                </label>
                <input
                  type="time"
                  id="dueTime"
                  name="dueTime"
                  defaultValue="09:00"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Additional details about this reminder..."
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                <Bell className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Reminder'}
              </Button>
              <Link href="/reminders" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>

        {/* Reminder Tips */}
        <div className="card p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Reminder Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start space-x-2">
              <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Set recurring reminders for regular activities like monthly medications</span>
            </li>
            <li className="flex items-start space-x-2">
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Choose notification timing based on how much preparation time you need</span>
            </li>
            <li className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Be specific in titles and descriptions for better organization</span>
            </li>
          </ul>
        </div>

        {/* Quick Templates */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              className="text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              onClick={() => fillTemplate('Annual Vaccination Due', 'vaccination', 'Time for annual vaccination shots')}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">💉</span>
                <div>
                  <p className="font-medium text-foreground">Annual Vaccination</p>
                  <p className="text-sm text-muted-foreground">Yearly vaccine reminder</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              className="text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              onClick={() => fillTemplate('Monthly Heartworm Medication', 'medication', 'Monthly heartworm prevention dose')}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">💊</span>
                <div>
                  <p className="font-medium text-foreground">Monthly Medication</p>
                  <p className="text-sm text-muted-foreground">Regular medication dose</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              className="text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              onClick={() => fillTemplate('Grooming Appointment', 'grooming', 'Regular grooming session')}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">✂️</span>
                <div>
                  <p className="font-medium text-foreground">Grooming Session</p>
                  <p className="text-sm text-muted-foreground">Professional grooming</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              className="text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              onClick={() => fillTemplate('Health Checkup', 'checkup', 'Routine health examination')}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">🩺</span>
                <div>
                  <p className="font-medium text-foreground">Health Checkup</p>
                  <p className="text-sm text-muted-foreground">Routine examination</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}