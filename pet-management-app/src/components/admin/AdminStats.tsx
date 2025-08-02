'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Users, Heart, Activity, Database } from 'lucide-react'

interface AdminStatsData {
  totalUsers: number
  totalPets: number
  activeFeatures: number
  systemHealth: number
  userGrowth: number
  petGrowth: number
  usersThisMonth?: number
  petsThisMonth?: number
}

export function AdminStats() {
  const [stats, setStats] = useState<AdminStatsData>({
    totalUsers: 0,
    totalPets: 0,
    activeFeatures: 0,
    systemHealth: 0,
    userGrowth: 0,
    petGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load admin stats')
      }
    } catch {
      setError('An error occurred while fetching admin stats')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      growth: stats.userGrowth,
      growthLabel: 'vs last month'
    },
    {
      title: 'Total Pets',
      value: stats.totalPets.toLocaleString(),
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      growth: stats.petGrowth,
      growthLabel: 'vs last month'
    },
    {
      title: 'Active Features',
      value: `${stats.activeFeatures}`,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      growth: null,
      growthLabel: 'features enabled'
    },
    {
      title: 'System Health',
      value: `${stats.systemHealth}%`,
      icon: Database,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      growth: null,
      growthLabel: 'uptime'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-muted rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="col-span-full">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <div key={stat.title} className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stat.value}
              </p>
              {stat.growth !== null ? (
                <div className="flex items-center space-x-1 mt-1">
                  {stat.growth > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : stat.growth < 0 ? (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  ) : null}
                  <span className={`text-xs ${
                    stat.growth > 0 
                      ? 'text-green-600' 
                      : stat.growth < 0 
                      ? 'text-red-600' 
                      : 'text-muted-foreground'
                  }`}>
                    {stat.growth > 0 ? '+' : ''}{stat.growth}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {stat.growthLabel}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.growthLabel}
                </p>
              )}
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