'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Activity, 
  Weight,
  Heart,
  AlertTriangle,
  Plus,
  BarChart3
} from 'lucide-react'
import { t } from '@/lib/translations'

interface HealthMetric {
  id: string
  petId: string
  metricType: string
  value: number
  unit: string
  date: string
  notes?: string
  pet: {
    id: string
    name: string
    species: string
    breed: string
  }
}

interface HealthAlert {
  id: string
  petId: string
  alertType: string
  severity: string
  message: string
  isRead: boolean
  createdAt: string
  pet: {
    id: string
    name: string
    species: string
    breed: string
  }
}

export function HealthAnalytics() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [alerts, setAlerts] = useState<HealthAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [metricsResponse, alertsResponse] = await Promise.all([
        fetch('/api/analytics/health-metrics'),
        fetch('/api/analytics/health-alerts?isRead=false')
      ])

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData)
      }

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setAlerts(alertsData)
      }
    } catch {
      setError('An error occurred while fetching data')
    } finally {
      setLoading(false)
    }
  }

  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'weight': return Weight
      case 'activity': return Activity
      case 'health_score': return Heart
      default: return BarChart3
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">{t('analytics.signInRequired')}</h3>
        <p className="text-muted-foreground mb-4">{t('analytics.signInToViewAnalytics')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Health Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>{t('analytics.healthAlerts')}</span>
          </h3>
          {alerts.map((alert) => (
            <Card key={alert.id} className="p-4 border-l-4 border-orange-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {alert.pet.name}
                    </span>
                  </div>
                  <p className="text-foreground">{alert.message}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('analytics.recentMetrics')}</h3>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {t('analytics.addMetric')}
          </Button>
        </div>

        {metrics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.slice(0, 6).map((metric) => {
              const Icon = getMetricIcon(metric.metricType)
              return (
                <Card key={metric.id} className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium capitalize">
                        {metric.metricType.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {metric.pet.name}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">
                        {metric.value}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {metric.unit}
                      </span>
                    </div>
                    {metric.notes && (
                      <p className="text-sm text-muted-foreground">
                        {metric.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(metric.date).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('analytics.noMetrics')}</h3>
            <p className="text-muted-foreground">{t('analytics.startTracking')}</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">{t('analytics.quickActions')}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Button variant="outline" className="justify-start">
            <Weight className="w-4 h-4 mr-2" />
            {t('analytics.addWeight')}
          </Button>
          <Button variant="outline" className="justify-start">
            <Activity className="w-4 h-4 mr-2" />
            {t('analytics.addActivity')}
          </Button>
          <Button variant="outline" className="justify-start">
            <Heart className="w-4 h-4 mr-2" />
            {t('analytics.calculateHealthScore')}
          </Button>
          <Button variant="outline" className="justify-start">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t('analytics.viewTrends')}
          </Button>
        </div>
      </Card>
    </div>
  )
}