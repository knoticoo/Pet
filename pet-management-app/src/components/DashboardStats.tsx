'use client'

import { Heart, Calendar, DollarSign, Bell } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { t } from '@/lib/translations'

interface Stats {
  totalPets: number
  upcomingAppointments: number
  monthlyExpenses: number
  activeReminders: number
}

export function DashboardStats() {
  const { data: session } = useSession()
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
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [petsRes, appointmentsRes, expensesRes, remindersRes] = await Promise.all([
        fetch('/api/pets'),
        fetch('/api/appointments'),
        fetch('/api/expenses'),
        fetch('/api/reminders?status=active')
      ])

      const [pets, appointments, expenses, reminders] = await Promise.all([
        petsRes.ok ? petsRes.json() : [],
        appointmentsRes.ok ? appointmentsRes.json() : [],
        expensesRes.ok ? expensesRes.json() : [],
        remindersRes.ok ? remindersRes.json() : []
      ])

      // Calculate upcoming appointments (next 30 days)
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const upcomingAppointments = appointments.filter((apt: { date: string }) => {
        const aptDate = new Date(apt.date)
        return aptDate >= now && aptDate <= thirtyDaysFromNow
      }).length

      // Calculate current month expenses
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const monthlyExpenses = expenses
        .filter((expense: { date: string; amount: number }) => {
          const expenseDate = new Date(expense.date)
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
        })
        .reduce((total: number, expense: { amount: number }) => total + expense.amount, 0)

      setStats({
        totalPets: pets.length,
        upcomingAppointments,
        monthlyExpenses,
        activeReminders: reminders.length
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount)
  }

  const statsData = [
    {
      title: t('stats.totalPets'),
      value: loading ? '...' : stats.totalPets.toString(),
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    {
      title: t('stats.upcomingAppointments'),
      value: loading ? '...' : stats.upcomingAppointments.toString(),
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: t('stats.monthlyExpenses'),
      value: loading ? '...' : formatCurrency(stats.monthlyExpenses),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: t('stats.activeReminders'),
      value: loading ? '...' : stats.activeReminders.toString(),
      icon: Bell,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statsData.map((stat) => (
        <div key={stat.title} className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stat.value}
              </p>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}