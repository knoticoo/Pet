'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Bell, Calendar, Clock, Trash2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { t } from '@/lib/translations'

interface Reminder {
  id: string
  title: string
  description?: string
  dueDate: string
  reminderType: string
  isCompleted: boolean
  isRecurring: boolean
  recurringInterval?: string
  pet?: {
    id: string
    name: string
    species: string
  }
}

export default function ReminderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [reminder, setReminder] = useState<Reminder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reminderId = params.id as string

  useEffect(() => {
    if (session?.user?.id && reminderId) {
      fetchReminderDetails()
    }
  }, [session, reminderId])

  const fetchReminderDetails = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/reminders/${reminderId}`)
      if (response.ok) {
        const data = await response.json()
        setReminder(data)
      } else if (response.status === 404) {
        setError('Reminder not found')
      } else {
        setError('Failed to load reminder')
      }
    } catch (error) {
      console.error('Error fetching reminder details:', error)
      setError('Failed to load reminder details')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async () => {
    if (!reminder) return

    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reminder,
          isCompleted: !reminder.isCompleted,
        }),
      })

      if (response.ok) {
        const updatedReminder = await response.json()
        setReminder(updatedReminder)
      } else {
        setError('Failed to update reminder')
      }
    } catch (error) {
      console.error('Error updating reminder:', error)
      setError('Failed to update reminder')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this reminder? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/reminders')
      } else {
        setError('Failed to delete reminder')
      }
    } catch (error) {
      console.error('Error deleting reminder:', error)
      setError('Failed to delete reminder')
    }
  }

  const getReminderTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'medication':
        return '💊'
      case 'appointment':
        return '🏥'
      case 'vaccination':
        return '💉'
      case 'grooming':
        return '✂️'
      case 'exercise':
        return '🏃'
      case 'feeding':
        return '🍽️'
      default:
        return '📋'
    }
  }

  const getReminderTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'medication':
        return 'from-red-400 to-red-600'
      case 'appointment':
        return 'from-blue-400 to-blue-600'
      case 'vaccination':
        return 'from-green-400 to-green-600'
      case 'grooming':
        return 'from-purple-400 to-purple-600'
      case 'exercise':
        return 'from-orange-400 to-orange-600'
      case 'feeding':
        return 'from-yellow-400 to-yellow-600'
      default:
        return 'from-gray-400 to-gray-600'
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && !reminder?.isCompleted
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading reminder details...</p>
        </div>
      </AuthGuard>
    )
  }

  if (error || !reminder) {
    return (
      <AuthGuard>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Bell className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{error || 'Reminder not found'}</h3>
            <p className="text-muted-foreground mb-6">
              The reminder you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/reminders">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reminders
              </Button>
            </Link>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/reminders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reminders
              </Button>
            </Link>
            <div className={`w-16 h-16 bg-gradient-to-br ${getReminderTypeColor(reminder.reminderType)} rounded-full flex items-center justify-center text-2xl`}>
              {getReminderTypeIcon(reminder.reminderType)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{reminder.title}</h1>
              <p className="text-muted-foreground">
                {reminder.reminderType} • {reminder.pet?.name && `for ${reminder.pet.name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={reminder.isCompleted ? "default" : "outline"}
              onClick={handleToggleComplete}
              className={reminder.isCompleted ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {reminder.isCompleted ? 'Completed' : 'Mark Complete'}
            </Button>
            <Link href={`/reminders/${reminder.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Status Alert */}
        {isOverdue(reminder.dueDate) && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              <span className="font-medium">This reminder is overdue!</span>
            </div>
          </div>
        )}

        {reminder.isCompleted && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">This reminder has been completed.</span>
            </div>
          </div>
        )}

        {/* Reminder Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Reminder Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="text-foreground capitalize">{reminder.reminderType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                <p className="text-foreground">
                  {new Date(reminder.dueDate).toLocaleDateString()} at{' '}
                  {new Date(reminder.dueDate).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className={`text-foreground ${
                  reminder.isCompleted ? 'text-green-600' : 
                  isOverdue(reminder.dueDate) ? 'text-red-600' : 
                  'text-yellow-600'
                }`}>
                  {reminder.isCompleted ? 'Completed' : 
                   isOverdue(reminder.dueDate) ? 'Overdue' : 'Pending'}
                </p>
              </div>
              {reminder.isRecurring && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Recurring</label>
                  <p className="text-foreground capitalize">
                    {reminder.recurringInterval || 'Yes'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {reminder.description && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Description</h3>
              <p className="text-muted-foreground">{reminder.description}</p>
            </div>
          )}

          {/* Pet Information */}
          {reminder.pet && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Pet Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pet Name</label>
                  <p className="text-foreground">{reminder.pet.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Species</label>
                  <p className="text-foreground capitalize">{reminder.pet.species}</p>
                </div>
                <Link href={`/pets/${reminder.pet.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    View Pet Details
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {!reminder.isCompleted && (
              <Button onClick={handleToggleComplete} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Complete
              </Button>
            )}
            <Link href={`/reminders/${reminder.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Reminder
              </Button>
            </Link>
            {reminder.pet && (
              <Link href={`/reminders/new?petId=${reminder.pet.id}`}>
                <Button variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Add Another Reminder
                </Button>
              </Link>
            )}
            {reminder.pet && (
              <Link href={`/appointments/new?petId=${reminder.pet.id}`}>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}