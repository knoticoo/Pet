'use client'

import { Heart, Calendar, DollarSign, Bell, Camera, TrendingUp, Users, Award, Plus, ChevronRight, Star, Activity } from 'lucide-react'

import { AuthGuard } from '@/components/AuthGuard'
import { useAuthenticatedSession } from '@/hooks/useAuthenticatedSession'
import { useEffect, useState, useCallback } from 'react'
import { t } from '@/lib/translations'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { RecentPets } from '@/components/RecentPets'
import { RecentReminders } from '@/components/RecentReminders'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { QuickActions } from '@/components/dashboard/QuickActions'

interface Stats {
  totalPets: number
  upcomingAppointments: number
  monthlyExpenses: number
  activeReminders: number
  socialPosts: number
  followers: number
}

interface RecentPost {
  id: string
  petName: string
  imageUrl: string
  likes: number
  createdAt: string
}

interface HealthAlert {
  id: string
  petName: string
  type: string
  message: string
  severity: 'low' | 'medium' | 'high'
  createdAt: string
}

export default function DashboardPage() {
  const { session } = useAuthenticatedSession()

  const [stats, setStats] = useState<Stats>({
    totalPets: 0,
    upcomingAppointments: 0,
    monthlyExpenses: 0,
    activeReminders: 0,
    socialPosts: 0,
    followers: 0
  })
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      const [
        petsResponse, 
        appointmentsResponse, 
        expensesResponse, 
        remindersResponse, 
        socialResponse,
        profileResponse
      ] = await Promise.all([
        fetch('/api/pets'),
        fetch('/api/appointments'),
        fetch('/api/expenses'),
        fetch('/api/reminders'),
        fetch(`/api/users/${session?.user?.id}/posts`),
        fetch(`/api/users/${session?.user?.id}/profile`)
      ])

      const pets = await petsResponse.json()
      const appointments = await appointmentsResponse.json()
      const expenses = await expensesResponse.json()
      const reminders = await remindersResponse.json()
      const socialPosts = socialResponse.ok ? await socialResponse.json() : []
      const profile = profileResponse.ok ? await profileResponse.json() : { stats: { followersCount: 0 } }

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
        activeReminders,
        socialPosts: socialPosts.length,
        followers: profile.stats?.followersCount || 0
      })

      // Set recent posts (last 3)
      setRecentPosts(socialPosts.slice(0, 3).map((post: { id: string; petName: string; imageUrl: string; likes: number; createdAt: string }) => ({
        id: post.id,
        petName: post.petName,
        imageUrl: post.imageUrl,
        likes: post.likes,
        createdAt: post.createdAt
      })))

      // Mock health alerts (you'd implement this based on your health monitoring)
      setHealthAlerts([
        {
          id: '1',
          petName: pets[0]?.name || 'Your Pet',
          type: 'vaccination',
          message: 'Vaccination due in 3 days',
          severity: 'medium',
          createdAt: new Date().toISOString()
        }
      ])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData()
    }
  }, [session, fetchDashboardData])

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <Link href="/pets" className="card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">{t('stats.totalPets')}</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalPets}</p>
              </div>
            </div>
          </Link>

          <Link href="/appointments" className="card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">{t('stats.upcomingAppointments')}</p>
                <p className="text-2xl font-bold text-purple-900">{stats.upcomingAppointments}</p>
              </div>
            </div>
          </Link>

          <Link href="/expenses" className="card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">{t('stats.monthlyExpenses')}</p>
                <p className="text-2xl font-bold text-green-900">${stats.monthlyExpenses.toFixed(2)}</p>
              </div>
            </div>
          </Link>

          <Link href="/reminders" className="card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-700 font-medium">{t('stats.activeReminders')}</p>
                <p className="text-2xl font-bold text-orange-900">{stats.activeReminders}</p>
              </div>
            </div>
          </Link>

          <Link href="/social" className="card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-pink-500 rounded-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-pink-700 font-medium">Social Posts</p>
                <p className="text-2xl font-bold text-pink-900">{stats.socialPosts}</p>
              </div>
            </div>
          </Link>

          <Link href={`/profile/${session?.user?.id}`} className="card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-indigo-700 font-medium">Followers</p>
                <p className="text-2xl font-bold text-indigo-900">{stats.followers}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Recent Social Posts */}
          <div className="card p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Camera className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Recent Posts</h3>
              </div>
              <Link href="/social">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            {recentPosts.length > 0 ? (
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <div key={post.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      <Image
                        src={post.imageUrl}
                        alt={post.petName}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{post.petName}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Heart className="h-3 w-3" />
                        <span>{post.likes} likes</span>
                        <span>•</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">No posts yet</p>
                <Link href="/social/upload">
                  <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80">
                    <Plus className="h-4 w-4 mr-2" />
                    Share First Photo
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Health Alerts */}
          <div className="card p-6 bg-gradient-to-br from-red-50 to-red-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-foreground">Health Alerts</h3>
              </div>
              <Link href="/pets">
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            {healthAlerts.length > 0 ? (
              <div className="space-y-3">
                {healthAlerts.map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{alert.petName}</p>
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.severity === 'high' ? 'bg-red-200 text-red-800' :
                        alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {alert.severity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Star className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-green-700 font-medium">All pets are healthy!</p>
                <p className="text-green-600 text-sm">No health alerts at the moment</p>
              </div>
            )}
          </div>

          {/* Achievement/Insights */}
          <div className="card p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold text-foreground">Insights</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Pet Care Streak</span>
                </div>
                <p className="text-2xl font-bold text-yellow-900">7 days</p>
                <p className="text-sm text-yellow-700">Keep up the great work!</p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Heart className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Social Engagement</span>
                </div>
                <p className="text-2xl font-bold text-yellow-900">{stats.socialPosts > 0 ? '📈' : '🚀'}</p>
                <p className="text-sm text-yellow-700">
                  {stats.socialPosts > 0 ? 'Growing community presence' : 'Ready to share your first post'}
                </p>
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
