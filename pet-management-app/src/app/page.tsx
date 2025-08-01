'use client'

import { Heart, Plus, Calendar, DollarSign, FileText, Bell, TrendingUp, Users, Activity } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { t } from '@/lib/translations'
import { useTheme, themes } from '@/lib/theme-provider'
import { RecentPets } from '@/components/RecentPets'
import { RecentReminders } from '@/components/RecentReminders'
import { DebugSession } from '@/components/DebugSession'

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
      const upcomingAppointments = appointments.filter((appointment: any) => {
        const appointmentDate = new Date(appointment.date)
        return appointmentDate >= now && appointmentDate <= nextWeek
      }).length

      // Calculate monthly expenses
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthlyExpenses = expenses
        .filter((expense: any) => new Date(expense.date) >= thisMonth)
        .reduce((sum: number, expense: any) => sum + expense.amount, 0)

      // Calculate active reminders
      const activeReminders = reminders.filter((reminder: any) => !reminder.isCompleted).length

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

  const getThemeIcon = () => {
    const themeConfig = themes[theme]
    switch (theme) {
      case 'dogs':
        return '🐕'
      case 'cats':
        return '🐱'
      case 'birds':
        return '🐦'
      case 'fish':
        return '🐠'
      case 'rabbits':
        return '🐰'
      case 'hamsters':
        return '🐹'
      case 'reptiles':
        return '🦎'
      default:
        return '🐾'
    }
  }

  const getThemeColor = () => {
    const themeConfig = themes[theme]
    return themeConfig.colors.primary
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
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{getThemeIcon()}</span>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
            </div>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              {t('dashboard.welcome')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Текущая тема: <span style={{ color: getThemeColor() }}>{themes[theme].name}</span>
            </p>
          </div>
          <Link href="/pets/new">
            <Button className="flex items-center space-x-2 w-full md:w-auto">
              <Plus className="h-4 w-4" />
              <span>{t('dashboard.addPet')}</span>
            </Button>
          </Link>
        </div>

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

        {/* Debug Session */}
        <DebugSession />
        
        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentPets />
          <RecentReminders />
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/pets/new">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Plus className="h-6 w-6" />
                <span className="text-sm">Добавить питомца</span>
              </Button>
            </Link>
            
            <Link href="/appointments/new">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Calendar className="h-6 w-6" />
                <span className="text-sm">Записаться к врачу</span>
              </Button>
            </Link>
            
            <Link href="/expenses/new">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <DollarSign className="h-6 w-6" />
                <span className="text-sm">Добавить расход</span>
              </Button>
            </Link>
            
            <Link href="/reminders/new">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Bell className="h-6 w-6" />
                <span className="text-sm">Создать напоминание</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
