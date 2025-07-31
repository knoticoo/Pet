'use client'

import { Bell, Calendar, Pill, Heart, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

// Mock data - in a real app, this would come from your database
const mockReminders = [
  {
    id: '1',
    title: 'Pet 1 - Annual Vaccination',
    type: 'vaccination',
    dueDate: new Date('2024-02-20'),
    petName: 'Pet 1',
    isCompleted: false
  },
  {
    id: '2',
    title: 'Pet 2 - Flea Treatment',
    type: 'medication',
    dueDate: new Date('2024-02-25'),
    petName: 'Pet 2',
    isCompleted: false
  },
  {
    id: '3',
    title: 'Pet 3 - Vet Checkup',
    type: 'checkup',
    dueDate: new Date('2024-03-01'),
    petName: 'Pet 3',
    isCompleted: false
  },
  {
    id: '4',
    title: 'Pet 1 - Grooming',
    type: 'grooming',
    dueDate: new Date('2024-03-05'),
    petName: 'Pet 1',
    isCompleted: false
  }
]

const reminderIcons = {
  vaccination: Heart,
  medication: Pill,
  appointment: Calendar,
  grooming: Bell,
  default: Bell
}

const priorityColors = {
  high: 'text-red-600 bg-red-100',
  medium: 'text-yellow-600 bg-yellow-100',
  low: 'text-green-600 bg-green-100'
}

export function UpcomingReminders() {
  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getUrgencyText = (days: number) => {
    if (days < 0) return 'Overdue'
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    return `Due in ${days} days`
  }

  const getUrgencyColor = (days: number) => {
    if (days < 0) return 'text-red-600'
    if (days <= 1) return 'text-orange-600'
    if (days <= 3) return 'text-yellow-600'
    return 'text-muted-foreground'
  }

  if (mockReminders.length === 0) {
    return (
      <div className="text-center py-8">
        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No upcoming reminders</p>
        <Link 
          href="/reminders/new"
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          Create a reminder
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {mockReminders.slice(0, 4).map((reminder) => {
        const daysUntil = getDaysUntilDue(reminder.dueDate)
        const ReminderIcon = reminderIcons[reminder.type as keyof typeof reminderIcons] || reminderIcons.default
        
        return (
          <Link key={reminder.id} href={`/reminders/${reminder.id}`}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:shadow-sm transition-shadow cursor-pointer">
              <div className={`p-2 rounded-full ${priorityColors[reminder.priority as keyof typeof priorityColors]}`}>
                <ReminderIcon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">
                  {reminder.title}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(reminder.dueDate)}
                  </span>
                  <span className="text-xs">•</span>
                  <span className={`text-sm font-medium ${getUrgencyColor(daysUntil)}`}>
                    {getUrgencyText(daysUntil)}
                  </span>
                </div>
              </div>
              
              {daysUntil < 0 && (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </Link>
        )
      })}
      
      {mockReminders.length > 4 && (
        <div className="text-center pt-2">
          <Link 
            href="/reminders"
            className="text-sm text-primary hover:underline"
          >
            View all {mockReminders.length} reminders
          </Link>
        </div>
      )}
    </div>
  )
}