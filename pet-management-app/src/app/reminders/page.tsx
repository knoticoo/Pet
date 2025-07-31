import { Bell, Plus, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'

export default function RemindersPage() {
  // Sample reminders data - replace with actual data fetching
  const reminders = [
    {
      id: '1',
      title: 'Annual Vaccination Due',
      description: 'Time for Buddy\'s annual vaccination shots',
      dueDate: new Date('2024-02-20T09:00:00'),
      reminderType: 'vaccination',
      isCompleted: false,
      notifyBefore: 24,
      pet: { name: 'Buddy', species: 'dog' }
    },
    {
      id: '2',
      title: 'Heartworm Medication',
      description: 'Monthly heartworm prevention for Whiskers',
      dueDate: new Date('2024-02-15T18:00:00'),
      reminderType: 'medication',
      isCompleted: false,
      notifyBefore: 24,
      pet: { name: 'Whiskers', species: 'cat' }
    },
    {
      id: '3',
      title: 'Grooming Appointment',
      description: 'Charlie needs his monthly grooming',
      dueDate: new Date('2024-02-25T14:00:00'),
      reminderType: 'grooming',
      isCompleted: false,
      notifyBefore: 48,
      pet: { name: 'Charlie', species: 'dog' }
    },
    {
      id: '4',
      title: 'Dental Checkup Follow-up',
      description: 'Follow-up appointment after dental cleaning',
      dueDate: new Date('2024-01-30T10:00:00'),
      reminderType: 'appointment',
      isCompleted: true,
      notifyBefore: 24,
      pet: { name: 'Buddy', species: 'dog' }
    }
  ]

  const activeReminders = reminders.filter(r => !r.isCompleted)
  const completedReminders = reminders.filter(r => r.isCompleted)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
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

  const isOverdue = (date: Date) => {
    return date < new Date()
  }

  const isUpcoming = (date: Date) => {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    return date >= now && date <= tomorrow
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
                          
                          <p className="text-sm text-muted-foreground mb-3">{reminder.description}</p>
                          
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
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Done
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