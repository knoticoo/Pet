'use client'

import { useState, useEffect } from 'react'
import { Heart, Plus, Calendar, DollarSign, Bell } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'
import { useAuthenticatedSession } from '@/hooks/useAuthenticatedSession'
import { LoadingScreen } from '@/components/LoadingScreen'
import { t } from '@/lib/translations'

interface DashboardStats {
  totalPets: number
  upcomingAppointments: number
  monthlyExpenses: number
  activeReminders: number
}

interface Pet {
  id: string
  name: string
  species: string
  breed: string
  birthDate: string
}

interface Reminder {
  id: string
  title: string
  dueDate: string
  type: string
  petName: string
}

export default function DashboardPage() {
  const { session } = useAuthenticatedSession()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalPets: 0,
    upcomingAppointments: 0,
    monthlyExpenses: 0,
    activeReminders: 0
  })
  const [recentPets, setRecentPets] = useState<Pet[]>([])
  const [recentReminders, setRecentReminders] = useState<Reminder[]>([])

  useEffect(() => {
    if (session?.user?.id) {
      // Only show loading on first visit or if data is not cached
      const hasVisited = sessionStorage.getItem('dashboard-visited')
      if (!hasVisited) {
        // First time visit - show loading
        const timer = setTimeout(() => {
          loadDashboardData()
          setIsLoading(false)
          sessionStorage.setItem('dashboard-visited', 'true')
        }, 2000)
        return () => clearTimeout(timer)
      } else {
        // Subsequent visits - load data without loading screen
        loadDashboardData()
        setIsLoading(false)
      }
    }
  }, [session])

  const loadDashboardData = async () => {
    try {
      // Fetch dashboard data
      const [petsRes, remindersRes, appointmentsRes, expensesRes] = await Promise.all([
        fetch('/api/pets'),
        fetch('/api/reminders'),
        fetch('/api/appointments'),
        fetch('/api/expenses')
      ])

      if (petsRes.ok) {
        const pets = await petsRes.json()
        setRecentPets(pets.slice(0, 3))
        setStats(prev => ({ ...prev, totalPets: pets.length }))
      }

      if (remindersRes.ok) {
        const reminders = await remindersRes.json()
        setRecentReminders(reminders.slice(0, 5))
        setStats(prev => ({ ...prev, activeReminders: reminders.length }))
      }

      if (appointmentsRes.ok) {
        const appointments = await appointmentsRes.json()
        const upcomingAppointments = appointments.filter(apt => 
          apt.status === 'scheduled' && new Date(apt.date) > new Date()
        )
        setStats(prev => ({ ...prev, upcomingAppointments: upcomingAppointments.length }))
      }

      if (expensesRes.ok) {
        const expenses = await expensesRes.json()
        const thisMonthExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date)
          const now = new Date()
          return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
        })
        const monthlyTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
        setStats(prev => ({ ...prev, monthlyExpenses: monthlyTotal }))
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return Math.max(0, age - 1)
    }
    return age
  }

  const getGradientColor = (species: string) => {
    switch (species.toLowerCase()) {
      case 'dog':
        return 'from-blue-400 to-blue-600'
      case 'cat':
        return 'from-purple-400 to-purple-600'
      case 'bird':
        return 'from-green-400 to-green-600'
      case 'fish':
        return 'from-cyan-400 to-cyan-600'
      default:
        return 'from-pink-400 to-pink-600'
    }
  }

  if (isLoading) {
    return <LoadingScreen isVisible={true} onComplete={() => setIsLoading(false)} />
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {t('dashboard.title')}
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              {t('dashboard.welcome')}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/pets">
            <div className="card p-6 hover-lift cursor-pointer transition-all duration-200 hover:shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.totalPets')}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalPets}</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/appointments">
            <div className="card p-6 hover-lift cursor-pointer transition-all duration-200 hover:shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.upcomingAppointments')}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.upcomingAppointments}</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/expenses">
            <div className="card p-6 hover-lift cursor-pointer transition-all duration-200 hover:shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.monthlyExpenses')}</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.monthlyExpenses)}</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/reminders">
            <div className="card p-6 hover-lift cursor-pointer transition-all duration-200 hover:shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.activeReminders')}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.activeReminders}</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/pets/new">
              <Button className="w-full h-16 flex flex-col items-center justify-center space-y-2 hover-lift">
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Добавить питомца</span>
              </Button>
            </Link>
            
            <Link href="/appointments/new">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-2 hover-lift">
                <Calendar className="h-6 w-6" />
                <span className="text-sm font-medium">Записаться к врачу</span>
              </Button>
            </Link>
            
            <Link href="/expenses/new">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-2 hover-lift">
                <DollarSign className="h-6 w-6" />
                <span className="text-sm font-medium">Добавить расход</span>
              </Button>
            </Link>
            
            <Link href="/reminders/new">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-2 hover-lift">
                <Bell className="h-6 w-6" />
                <span className="text-sm font-medium">Создать напоминание</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Pets */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">{t('dashboard.recentPets')}</h2>
              <Link href="/pets">
                <Button variant="ghost" size="sm">
                  {t('dashboard.viewAllPets')}
                </Button>
              </Link>
            </div>
            
            {recentPets.length > 0 ? (
              <div className="space-y-4">
                {recentPets.map((pet) => (
                  <Link key={pet.id} href={`/pets/${pet.id}`}>
                    <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className={`w-12 h-12 bg-gradient-to-br ${getGradientColor(pet.species)} rounded-full flex items-center justify-center`}>
                        <Heart className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{pet.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {pet.breed} • {calculateAge(pet.birthDate)} {t('common.years')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('dashboard.noData')}</p>
                <Link href="/pets/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('pets.addPet')}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Reminders */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">{t('dashboard.recentReminders')}</h2>
              <Link href="/reminders">
                <Button variant="ghost" size="sm">
                  {t('dashboard.viewAllReminders')}
                </Button>
              </Link>
            </div>
            
            {recentReminders.length > 0 ? (
              <div className="space-y-3">
                {recentReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center space-x-3 p-3 rounded-lg bg-accent/30">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                      <Bell className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{reminder.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {reminder.petName} • {new Date(reminder.dueDate).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('dashboard.noData')}</p>
                <Link href="/reminders/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Создать напоминание
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Health Tips */}
        <div className="card p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <h2 className="text-xl font-semibold text-foreground mb-4">💡 Советы по уходу</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/50 dark:bg-white/10 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Регулярные осмотры</h3>
              <p className="text-sm text-muted-foreground">
                Планируйте ежегодные визиты к ветеринару для поддержания здоровья вашего питомца.
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-white/10 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Правильное питание</h3>
              <p className="text-sm text-muted-foreground">
                Обеспечьте сбалансированное питание в соответствии с возрастом и породой питомца.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
