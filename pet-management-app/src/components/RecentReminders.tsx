'use client'

import { Bell, Plus, Calendar, Pill, Heart, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthenticatedSession } from '@/hooks/useAuthenticatedSession'
import { useEffect, useState, useCallback, memo } from 'react'
import { t } from '@/lib/translations'
import { formatDate } from '@/lib/utils'

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

// Cache for reminders data
const remindersCache = new Map<string, { reminders: Reminder[], timestamp: number }>()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes for reminders data

const reminderIcons = {
  vaccination: Heart,
  medication: Pill,
  appointment: Calendar,
  grooming: Bell,
  checkup: Calendar,
  default: Bell
}

const ReminderCard = memo(({ reminder }: { reminder: Reminder }) => {
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

  const daysUntil = getDaysUntilDue(reminder.dueDate)
  const ReminderIcon = reminderIcons[reminder.reminderType as keyof typeof reminderIcons] || reminderIcons.default

  return (
    <Link href={`/reminders/${reminder.id}`} className="block">
      <div className="reminder-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <ReminderIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{reminder.title}</h3>
            <p className="text-sm text-muted-foreground">
              {reminder.pet.name} • {reminder.reminderType}
            </p>
          </div>
          {daysUntil < 0 && (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('reminders.dueDate')}:</span>
            <span className={getUrgencyColor(daysUntil)}>
              {getUrgencyText(daysUntil)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('reminders.date')}:</span>
            <span>{formatDate(new Date(reminder.dueDate))}</span>
          </div>
          
          {reminder.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {reminder.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
})

ReminderCard.displayName = 'ReminderCard'

export const RecentReminders = memo(() => {
  const { session } = useAuthenticatedSession()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReminders = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    const cacheKey = session.user.id
    
    // Check cache first
    const cached = remindersCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setReminders(cached.reminders)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/reminders?status=active', {
        headers: {
          'Cache-Control': 'max-age=120', // 2 minutes client-side cache
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Filter to upcoming reminders only (not overdue) and limit to recent
        const upcomingReminders = data
          .filter((reminder: Reminder) => {
            const dueDate = new Date(reminder.dueDate)
            const today = new Date()
            return dueDate >= today
          })
          .slice(0, 4) // Limit to 4 most recent
        
        // Update cache
        remindersCache.set(cacheKey, { reminders: upcomingReminders, timestamp: Date.now() })
        setReminders(upcomingReminders)
      } else {
        console.error('Failed to fetch reminders:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchReminders()
  }, [fetchReminders])

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t('dashboard.recentReminders')}</h2>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('auth.signInRequired')}</h3>
          <p className="text-muted-foreground mb-4">{t('dashboard.signInToViewReminders')}</p>
          <Button asChild>
            <Link href="/auth/signin">{t('auth.signIn')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{t('dashboard.recentReminders')}</h2>
        <Button asChild size="sm" variant="outline">
          <Link href="/reminders">
            {t('dashboard.viewAll')}
          </Link>
        </Button>
      </div>
      
      {reminders.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('reminders.noReminders')}</h3>
          <p className="text-muted-foreground mb-4">{t('reminders.createFirst')}</p>
          <Button asChild>
            <Link href="/reminders/new">
              <Plus className="w-4 h-4 mr-2" />
              {t('reminders.createReminder')}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
          
          {reminders.length >= 4 && (
            <div className="pt-4 border-t">
              <Button asChild variant="outline" className="w-full">
                <Link href="/reminders">{t('dashboard.viewAllReminders')}</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

RecentReminders.displayName = 'RecentReminders'