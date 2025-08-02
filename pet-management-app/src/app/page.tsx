'use client'

import { Heart, Calendar, DollarSign, Bell } from 'lucide-react'

import { AuthGuard } from '@/components/AuthGuard'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { t } from '@/lib/translations'
import { useTheme, themes } from '@/lib/theme-provider'
import { RecentPets } from '@/components/RecentPets'
import { RecentReminders } from '@/components/RecentReminders'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { QuickActions } from '@/components/dashboard/QuickActions'

interface Stats {
  totalPets: number
  upcomingAppointments: number
  monthlyExpenses: number
  activeReminders: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const { theme } = useTheme()
  const [stats, setStats] = useState<Stats>({
    totalPets: 0,
    upcomingAppointments: 0,
    monthlyExpenses: 0,
    activeReminders: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      const [petsResponse, appointmentsResponse, expensesResponse, remindersResponse] = await Promise.all([
        fetch('/api/pets'),
        fetch('/api/appointments'),
        fetch('/api/expenses'),
        fetch('/api/reminders')
      ])

      const pets = await petsResponse.json()
      const appointments = await appointmentsResponse.json()
      const expenses = await expensesResponse.json()
      const reminders = await remindersResponse.json()

      // Calculate upcoming appointments (next 7 days)
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const upcomingAppointments = appointments.filter((appointment: { date: string }) => {
        const appointmentDate = new Date(appointment.date)
        return appointmentDate >= now && appointmentDate <= nextWeek
      }).length

      // Calculate monthly expenses
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthlyExpenses = expenses
        .filter((expense: { date: string; amount: number }) => new Date(expense.date) >= thisMonth)
        .reduce((sum: number, expense: { amount: number }) => sum + expense.amount, 0)

      // Calculate active reminders
      const activeReminders = reminders.filter((reminder: { isCompleted: boolean }) => !reminder.isCompleted).length

      setStats({
        totalPets: pets.length,
        upcomingAppointments,
        monthlyExpenses,
        activeReminders
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }



  if (loading) {
    return (
      <AuthGuard>
        <div className="space-y-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">{t('common.loading')}</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header with Theme Info */}
        <DashboardHeader />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.totalPets')}</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalPets}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.upcomingAppointments')}</p>
                <p className="text-2xl font-bold text-foreground">{stats.upcomingAppointments}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.monthlyExpenses')}</p>
                <p className="text-2xl font-bold text-foreground">${stats.monthlyExpenses.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-2">
              <Bell className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.activeReminders')}</p>
                <p className="text-2xl font-bold text-foreground">{stats.activeReminders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentPets />
          <RecentReminders />
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </AuthGuard>
  )
}
