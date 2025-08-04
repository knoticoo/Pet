'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Heart, Plus, Calendar, DollarSign, Bell, Sparkles, TrendingUp, Activity, Zap, ArrowRight, Play, Pause, Shield, Award } from 'lucide-react'
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

interface Appointment {
  id: string
  title: string
  date: string
  duration: number
  location?: string
  vetName?: string
  appointmentType: string
  status: string
  notes?: string
  petId: string
  pet: {
    name: string
    species: string
  }
}

interface Expense {
  id: string
  title: string
  amount: number
  date: string
  category: string
  petId: string
}

export default function DashboardPage() {
  const { session, isLoading: sessionLoading } = useAuthenticatedSession()
  const [isLoading, setIsLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const [showParticles, setShowParticles] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [stats, setStats] = useState<DashboardStats>({
    totalPets: 0,
    upcomingAppointments: 0,
    monthlyExpenses: 0,
    activeReminders: 0
  })
  const [recentPets, setRecentPets] = useState<Pet[]>([])
  const [recentReminders, setRecentReminders] = useState<Reminder[]>([])

  // Particle animation system
  useEffect(() => {
    if (!canvasRef.current || !showParticles) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      color: string
    }> = []

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(particle => {
        particle.x += particle.vx
        particle.y += particle.vy
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1
        
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = particle.opacity
        ctx.fill()
      })
      
      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showParticles])

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const loadDashboardData = useCallback(async () => {
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
        const upcomingAppointments = appointments.filter((apt: Appointment) => 
          apt.status === 'scheduled' && new Date(apt.date) > new Date()
        )
        setStats(prev => ({ ...prev, upcomingAppointments: upcomingAppointments.length }))
      }

      if (expensesRes.ok) {
        const expenses = await expensesRes.json()
        const thisMonthExpenses = expenses.filter((expense: Expense) => {
          const expenseDate = new Date(expense.date)
          const now = new Date()
          return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
        })
        const monthlyTotal = thisMonthExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0)
        setStats(prev => ({ ...prev, monthlyExpenses: monthlyTotal }))
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }, [])

  // Handle client-side mounting
  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!hasMounted || sessionLoading) return

    if (session?.user?.id) {
      const hasVisited = typeof window !== 'undefined' ? sessionStorage.getItem('dashboard-visited') : null
      if (!hasVisited) {
        const timer = setTimeout(() => {
          loadDashboardData()
          setIsLoading(false)
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('dashboard-visited', 'true')
          }
        }, 2000)
        return () => clearTimeout(timer)
      } else {
        loadDashboardData()
        setIsLoading(false)
      }
    } else if (!sessionLoading) {
      setIsLoading(false)
    }
  }, [session?.user?.id, sessionLoading, hasMounted, loadDashboardData])

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
        return 'from-blue-400 via-blue-500 to-blue-600'
      case 'cat':
        return 'from-purple-400 via-purple-500 to-purple-600'
      case 'bird':
        return 'from-green-400 via-green-500 to-green-600'
      case 'fish':
        return 'from-cyan-400 via-cyan-500 to-cyan-600'
      default:
        return 'from-pink-400 via-pink-500 to-pink-600'
    }
  }

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false)
  }, [])

  if (isLoading && hasMounted) {
    return <LoadingScreen isVisible={true} onComplete={handleLoadingComplete} />
  }

  if (isLoading && !hasMounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!hasMounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      {/* Particle Background */}
      {showParticles && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-0 opacity-30"
          style={{ background: 'transparent' }}
        />
      )}

      <div className="relative z-10 space-y-8">
        {/* Hero Section with Glassmorphism */}
        <div className="relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-3xl animate-pulse"></div>
          
          <div className="relative p-8 md:p-12 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 animate-pulse">
                      <Heart className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">Live Dashboard</span>
                  </div>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  {t('dashboard.title')}
                </h1>
                <p className="text-xl text-muted-foreground mb-6 max-w-2xl">
                  {t('dashboard.welcome')} • {currentTime.toLocaleTimeString('ru-RU')}
                </p>
                
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                    <Plus className="h-5 w-5 mr-2" />
                    Добавить питомца
                  </Button>
                  <Button variant="outline" className="border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 transform hover:-translate-y-1 transition-all duration-300">
                    <Calendar className="h-5 w-5 mr-2" />
                    Записаться к врачу
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                      <Activity className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Активность</p>
                  <p className="text-2xl font-bold text-foreground">98%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/pets">
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm border border-white/20 p-6 hover:shadow-2xl hover:shadow-blue-500/20 transform hover:-translate-y-2 transition-all duration-500 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.totalPets')}</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalPets}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">+12%</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Link>

          <Link href="/appointments">
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm border border-white/20 p-6 hover:shadow-2xl hover:shadow-green-500/20 transform hover:-translate-y-2 transition-all duration-500 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.upcomingAppointments')}</p>
                  <p className="text-3xl font-bold text-foreground">{stats.upcomingAppointments}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-yellow-500">Сегодня: 2</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Link>

          <Link href="/expenses">
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm border border-white/20 p-6 hover:shadow-2xl hover:shadow-purple-500/20 transform hover:-translate-y-2 transition-all duration-500 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.monthlyExpenses')}</p>
                  <p className="text-3xl font-bold text-foreground">{formatCurrency(stats.monthlyExpenses)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">-8%</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Link>

          <Link href="/reminders">
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-sm border border-white/20 p-6 hover:shadow-2xl hover:shadow-orange-500/20 transform hover:-translate-y-2 transition-all duration-500 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Bell className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('stats.activeReminders')}</p>
                  <p className="text-3xl font-bold text-foreground">{stats.activeReminders}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Activity className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-500">Активные</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Link>
        </div>

        {/* Interactive Quick Actions */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Быстрые действия
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="hover:bg-white/10"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowParticles(!showParticles)}
                  className="hover:bg-white/10"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/pets/new">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 backdrop-blur-sm border border-primary/20 p-6 hover:shadow-2xl hover:shadow-primary/20 transform hover:-translate-y-2 transition-all duration-500 cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <Plus className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Добавить питомца</h3>
                      <p className="text-sm text-muted-foreground">Новый член семьи</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/appointments/new">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm border border-green-500/20 p-6 hover:shadow-2xl hover:shadow-green-500/20 transform hover:-translate-y-2 transition-all duration-500 cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Записаться к врачу</h3>
                      <p className="text-sm text-muted-foreground">Забота о здоровье</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/expenses/new">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm border border-purple-500/20 p-6 hover:shadow-2xl hover:shadow-purple-500/20 transform hover:-translate-y-2 transition-all duration-500 cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <DollarSign className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Добавить расход</h3>
                      <p className="text-sm text-muted-foreground">Учет трат</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/reminders/new">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-sm border border-orange-500/20 p-6 hover:shadow-2xl hover:shadow-orange-500/20 transform hover:-translate-y-2 transition-all duration-500 cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <Bell className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Создать напоминание</h3>
                      <p className="text-sm text-muted-foreground">Не забыть важное</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Content with Advanced Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Pets with Floating Animation */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  {t('dashboard.recentPets')}
                </h2>
                <Link href="/pets">
                  <Button variant="ghost" size="sm" className="hover:bg-white/10">
                    {t('dashboard.viewAllPets')}
                  </Button>
                </Link>
              </div>
              
              {recentPets.length > 0 ? (
                <div className="space-y-4">
                  {recentPets.map((pet, index) => (
                    <Link key={pet.id} href={`/pets/${pet.id}`}>
                      <div 
                        className="group/pet relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-4 hover:shadow-xl hover:shadow-blue-500/20 transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover/pet:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center space-x-4">
                          <div className={`w-14 h-14 bg-gradient-to-br ${getGradientColor(pet.species)} rounded-2xl flex items-center justify-center shadow-lg group-hover/pet:shadow-xl transition-all duration-300`}>
                            <Heart className="h-7 w-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{pet.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {pet.breed} • {calculateAge(pet.birthDate)} {t('common.years')}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-green-500">Здоров</span>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/pet:opacity-100 transition-opacity duration-300" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative mb-6">
                    <Heart className="h-16 w-16 text-muted-foreground mx-auto animate-pulse" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">{t('dashboard.noData')}</p>
                  <Link href="/pets/new">
                    <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('pets.addPet')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Reminders with Advanced Styling */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                  {t('dashboard.recentReminders')}
                </h2>
                <Link href="/reminders">
                  <Button variant="ghost" size="sm" className="hover:bg-white/10">
                    {t('dashboard.viewAllReminders')}
                  </Button>
                </Link>
              </div>
              
              {recentReminders.length > 0 ? (
                <div className="space-y-4">
                  {recentReminders.map((reminder, index) => (
                    <div 
                      key={reminder.id} 
                      className="group/reminder relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-sm border border-orange-500/20 p-4 hover:shadow-xl hover:shadow-orange-500/20 transform hover:-translate-y-1 transition-all duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover/reminder:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover/reminder:shadow-xl transition-all duration-300">
                          <Bell className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{reminder.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {reminder.petName} • {new Date(reminder.dueDate).toLocaleDateString('ru-RU')}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-orange-500">Скоро</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
                          <span className="text-xs text-muted-foreground">Важно</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative mb-6">
                    <Bell className="h-16 w-16 text-muted-foreground mx-auto animate-pulse" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center animate-bounce">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">{t('dashboard.noData')}</p>
                  <Link href="/reminders/new">
                    <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-500/90 hover:to-red-600/90 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                      <Plus className="h-4 w-4 mr-2" />
                      Создать напоминание
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Health Tips Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-white/20 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-500 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  💡 Советы по уходу
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">AI Powered</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-6 hover:shadow-xl hover:shadow-green-500/20 transform hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground">Регулярные осмотры</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Планируйте ежегодные визиты к ветеринару для поддержания здоровья вашего питомца.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-500">Рекомендуется</span>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-6 hover:shadow-xl hover:shadow-blue-500/20 transform hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground">Правильное питание</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Обеспечьте сбалансированное питание в соответствии с возрастом и породой питомца.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-500">Важно</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <div className="relative">
            <Button
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300"
              onClick={() => setShowParticles(!showParticles)}
            >
              <Sparkles className="h-6 w-6" />
            </Button>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
