'use client'

import { Bell, Calendar, Pill, Heart, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { t } from '@/lib/translations'

interface Reminder {
  id: string
  title: string
  description?: string
  dueDate: string
  reminderType: string
  isCompleted: boolean
  pet: {
    id: string
    name: string
    species: string
  }
}

const reminderIcons = {
  vaccination: Heart,
  medication: Pill,
  appointment: Calendar,
  grooming: Bell,
  checkup: Calendar,
  default: Bell
}

const priorityColors = {
  high: 'text-red-600 bg-red-100',
  medium: 'text-yellow-600 bg-yellow-100',
  low: 'text-green-600 bg-green-100'
}

export function UpcomingReminders() {
  const { data: session } = useSession()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchReminders()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/reminders?status=active')
      if (response.ok) {
        const data = await response.json()
        // Filter to upcoming reminders only (not overdue)
        const upcomingReminders = data.filter((reminder: Reminder) => {
          const dueDate = new Date(reminder.dueDate)
          const today = new Date()
          return dueDate >= today
        })
        setReminders(upcomingReminders)
      } else {
        console.error('Failed to fetch reminders:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getUrgencyText = (days: number) => {
    if (days < 0) return t('reminders.overdue')
    if (days === 0) return 'Сегодня'
    if (days === 1) return 'Завтра'
    return `Через ${days} дней`
  }

  const getUrgencyColor = (days: number) => {
    if (days < 0) return 'text-red-600'
    if (days <= 1) return 'text-orange-600'
    if (days <= 3) return 'text-yellow-600'
    return 'text-muted-foreground'
  }

  const getPriorityFromDays = (days: number) => {
    if (days < 0 || days <= 1) return 'high'
    if (days <= 3) return 'medium'
    return 'low'
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">{t('common.loading')}</p>
      </div>
    )
  }

  if (reminders.length === 0) {
    return (
      <div className="text-center py-8">
        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{t('reminders.noReminders')}</p>
        <Link 
          href="/reminders/new"
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          {t('reminders.createFirst')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reminders.slice(0, 4).map((reminder) => {
        const daysUntil = getDaysUntilDue(reminder.dueDate)
        const priority = getPriorityFromDays(daysUntil)
        const ReminderIcon = reminderIcons[reminder.reminderType as keyof typeof reminderIcons] || reminderIcons.default
        
        return (
          <Link key={reminder.id} href={`/reminders/${reminder.id}`}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:shadow-sm transition-shadow cursor-pointer">
              <div className={`p-2 rounded-full ${priorityColors[priority as keyof typeof priorityColors]}`}>
                <ReminderIcon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">
                  {reminder.title}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(new Date(reminder.dueDate))}
                  </span>
                  <span className="text-xs">•</span>
                  <span className="text-sm text-muted-foreground">
                    {reminder.pet.name}
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
      
      {reminders.length > 4 && (
        <div className="text-center pt-2">
          <Link 
            href="/reminders"
            className="text-sm text-primary hover:underline"
          >
            View all {reminders.length} reminders
          </Link>
        </div>
      )}
    </div>
  )
}