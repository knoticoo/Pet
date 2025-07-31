'use client'

import { useState, useEffect } from 'react'
import { Bell, Plus, Calendar, Clock, CheckCircle, AlertCircle, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'

interface Reminder {
  id: string
  title: string
  description?: string
  dueDate: string
  reminderType: string
  isCompleted: boolean
  notifyBefore: number
  pet: {
    id: string
    name: string
    species: string
  }
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/reminders')
      if (response.ok) {
        const data = await response.json()
        setReminders(data)
      } else {
        setError('Failed to fetch reminders')
      }
    } catch (error) {
      setError('An error occurred while fetching reminders')
    } finally {
      setLoading(false)
    }
  }

  const toggleReminderComplete = async (id: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      })

      if (response.ok) {
        const updatedReminder = await response.json()
        setReminders(prev => 
          prev.map(reminder => 
            reminder.id === id ? updatedReminder : reminder
          )
        )
      } else {
        setError('Failed to update reminder')
      }
    } catch (error) {
      setError('An error occurred while updating reminder')
    }
  }

  const deleteReminder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) {
      return
    }

    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setReminders(prev => prev.filter(reminder => reminder.id !== id))
      } else {
        setError('Failed to delete reminder')
      }
    } catch (error) {
      setError('An error occurred while deleting reminder')
    }
  }

  const activeReminders = reminders.filter(r => !r.isCompleted)
  const completedReminders = reminders.filter(r => r.isCompleted)

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  }

  const formatTime = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vaccination': return 'bg-red-100 text-red-800'
      case 'medication': return 'bg-orange-100 text-orange-800'
      case 'appointment': return 'bg-blue-100 text-blue-800'
      case 'grooming': return 'bg-purple-100 text-purple-800'
      case 'feeding': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vaccination': return '💉'
      case 'medication': return '💊'
      case 'appointment': return '🏥'
      case 'grooming': return '✂️'
      case 'feeding': return '🍖'
      default: return '📋'
    }
  }

  const isOverdue = (date: string) => {
    return new Date(date) < new Date()
  }

  const isUpcoming = (date: string) => {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const reminderDate = new Date(date)
    return reminderDate >= now && reminderDate <= tomorrow
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Bell className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading reminders...</p>
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
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reminders</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              Stay on top of your pets' care with automated reminders.
            </p>
          </div>
          <Link href="/reminders/new">
            <Button className="flex items-center space-x-2 w-full md:w-auto">
              <Plus className="h-4 w-4" />
              <span>Add Reminder</span>
            </Button>
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Active Reminders */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Active Reminders</h2>
            {activeReminders.length > 0 ? (
              <div className="space-y-4">
                {activeReminders.map((reminder) => (
                  <div 
                    key={reminder.id} 
                    className={`card p-6 ${
                      isOverdue(reminder.dueDate) 
                        ? 'border-red-200 bg-red-50' 
                        : isUpcoming(reminder.dueDate)
                        ? 'border-yellow-200 bg-yellow-50'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="text-2xl">{getTypeIcon(reminder.reminderType)}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{reminder.title}</h3>
                            {isOverdue(reminder.dueDate) && (
                              <span className="flex items-center space-x-1 text-red-600 text-sm font-medium">
                                <AlertCircle className="h-4 w-4" />
                                <span>Overdue</span>
                              </span>
                            )}
                            {isUpcoming(reminder.dueDate) && (
                              <span className="flex items-center space-x-1 text-yellow-600 text-sm font-medium">
                                <Clock className="h-4 w-4" />
                                <span>Due Soon</span>
                              </span>
                            )}
                          </div>
                          
                          {reminder.description && (
                            <p className="text-sm text-muted-foreground mb-3">{reminder.description}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(reminder.dueDate)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(reminder.dueDate)}</span>
                            </div>
                            <span className="text-muted-foreground">for {reminder.pet.name}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(reminder.reminderType)}`}>
                          {reminder.reminderType}
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleReminderComplete(reminder.id, reminder.isCompleted)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Done
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteReminder(reminder.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No active reminders</h3>
                <p className="text-muted-foreground mb-6">
                  Create reminders to stay on top of your pets' care schedule.
                </p>
                <Link href="/reminders/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Reminder
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Completed Reminders */}
          {completedReminders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Recently Completed</h2>
              <div className="space-y-3">
                {completedReminders.map((reminder) => (
                  <div key={reminder.id} className="card p-4 opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">{getTypeIcon(reminder.reminderType)}</div>
                        <div>
                          <h4 className="font-medium text-foreground line-through">{reminder.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {reminder.pet.name} • Completed on {formatDate(reminder.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Completed</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleReminderComplete(reminder.id, reminder.isCompleted)}
                        >
                          Undo
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteReminder(reminder.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-red-600 mb-2">
              {activeReminders.filter(r => isOverdue(r.dueDate)).length}
            </div>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-2">
              {activeReminders.filter(r => isUpcoming(r.dueDate)).length}
            </div>
            <p className="text-sm text-muted-foreground">Due Soon</p>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {completedReminders.length}
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}