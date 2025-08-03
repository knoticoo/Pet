'use client'

import { useState } from 'react'
import { t } from '@/lib/translations'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Puzzle, 
  Heart, 
  Camera, 
  BarChart3, 
  Users, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  Sparkles
} from 'lucide-react'

interface Plugin {
  id: string
  name: string
  description: string
  version: string
  category: 'social' | 'health' | 'analytics' | 'photography' | 'ai'
  isEnabled: boolean
  isCore: boolean
  dependencies?: string[]
  settings?: Record<string, unknown>
  permissions?: string[]
}

const categoryIcons = {
  social: Users,
  health: Heart,
  analytics: BarChart3,
  photography: Camera,
  ai: Brain
}

const categoryColors = {
  social: 'bg-purple-100 text-purple-800',
  health: 'bg-green-100 text-green-800',
  analytics: 'bg-blue-100 text-blue-800',
  photography: 'bg-pink-100 text-pink-800',
  ai: 'bg-orange-100 text-orange-800'
}

const availablePlugins: Plugin[] = [
  {
    id: 'ai-vet',
    name: 'ИИ Ветеринар',
    description: 'Искусственный интеллект для анализа здоровья питомцев, диагностики по фотографиям и предоставления рекомендаций.',
    version: '1.0.0',
    category: 'ai',
    isEnabled: true,
    isCore: true,
    dependencies: [],
    settings: {
      enablePhotoAnalysis: true,
      enableHealthInsights: true,
      enableHealthScoring: true,
      enablePredictiveAlerts: true,
      maxAnalysisPerDay: 50,
      confidenceThreshold: 0.7,
      enableAutoDiagnosis: true
    },
    permissions: ['ai-vet:read', 'ai-vet:write', 'ai-vet:admin']
  },
  {
    id: 'pet-social-network',
    name: 'Социальная сеть питомцев',
    description: 'Общайтесь с другими владельцами питомцев, делитесь фотографиями, присоединяйтесь к группам по породам и участвуйте в конкурсах питомцев с ИИ-анализом здоровья.',
    version: '1.0.0',
    category: 'social',
    isEnabled: false,
    isCore: false,
    dependencies: ['ai-vet'],
    settings: {
      enablePhotoSharing: true,
      enableContests: true,
      enableBreedGroups: true,
      enableHealthInsights: true,
      maxPhotosPerPost: 10,
      moderationEnabled: true,
      aiHealthAnalysis: true
    },
    permissions: ['social:read', 'social:write', 'social:moderate']
  },
  {
    id: 'pet-photography',
    name: 'Фотографии питомцев',
    description: 'Организуйте фотографии питомцев, создавайте временные шкалы роста и генерируйте фотокниги с ИИ-анализом здоровья.',
    version: '1.0.0',
    category: 'photography',
    isEnabled: false,
    isCore: false,
    dependencies: ['ai-vet'],
    settings: {
      enableGrowthTimeline: true,
      enablePhotoBooks: true,
      enableHealthAnalysis: true,
      maxStorageGB: 10,
      autoBackup: true,
      aiAnalysisEnabled: true,
      watermarkEnabled: false
    },
    permissions: ['photography:read', 'photography:write', 'photography:manage']
  },
  {
    id: 'health-analytics',
    name: 'Аналитика здоровья',
    description: 'Отслеживайте тренды веса, ИМТ, уровни активности, рассчитывайте оценки здоровья и получайте прогностические оповещения с ИИ-анализом.',
    version: '1.0.0',
    category: 'analytics',
    isEnabled: false,
    isCore: false,
    dependencies: ['ai-vet'],
    settings: {
      enableWeightTracking: true,
      enableBMICalculation: true,
      enableActivityAnalysis: true,
      enableHealthScoring: true,
      enablePredictiveAlerts: true,
      enableTrendAnalysis: true,
      aiInsightsEnabled: true,
      alertThresholds: {
        weightChange: 5,
        activityDrop: 20,
        healthScoreDrop: 10
      }
    },
    permissions: ['analytics:read', 'analytics:write', 'analytics:admin']
  }
]

export function AdminPluginManager() {
  const [plugins, setPlugins] = useState<Plugin[]>(availablePlugins)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['ai']))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)

  const togglePlugin = async (pluginId: string) => {
    const plugin = plugins.find(p => p.id === pluginId)
    if (!plugin) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/plugins/${pluginId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !plugin.isEnabled })
      })

      if (response.ok) {
        const updatedPlugin = await response.json()
        setPlugins(prev => prev.map(p => 
          p.id === pluginId ? updatedPlugin : p
        ))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to toggle plugin')
      }
    } catch {
      setError('An error occurred while toggling plugin')
    } finally {
      setLoading(false)
    }
  }

  const updatePluginSettings = async (pluginId: string, settings: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/admin/plugins/${pluginId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        const updatedPlugin = await response.json()
        setPlugins(prev => prev.map(p => 
          p.id === pluginId ? updatedPlugin : p
        ))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update plugin settings')
      }
    } catch {
      setError('An error occurred while updating plugin settings')
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const groupedPlugins = plugins.reduce((acc, plugin) => {
    if (!acc[plugin.category]) {
      acc[plugin.category] = []
    }
    acc[plugin.category].push(plugin)
    return acc
  }, {} as Record<string, Plugin[]>)

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">{t('plugins.active')}</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {plugins.filter(p => p.isEnabled).length}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">{t('plugins.inactive')}</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {plugins.filter(p => !p.isEnabled).length}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">{t('plugins.aiPowered')}</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {plugins.filter(p => p.dependencies?.includes('ai-vet')).length}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-800">{t('plugins.new')}</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {plugins.length}
            </div>
          </div>
      </div>

      {/* Plugin Categories */}
      {Object.entries(groupedPlugins).map(([category, categoryPlugins]) => {
        const isExpanded = expandedCategories.has(category)
        const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons] || Puzzle
        
        return (
          <div key={category} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full p-4 bg-muted hover:bg-muted/80 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <CategoryIcon className="h-5 w-5 text-primary" />
                <span className="font-medium capitalize">{category}</span>
                                 <Badge variant="secondary">
                   {categoryPlugins.length} {t('plugins.title')}
                 </Badge>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {isExpanded && (
              <div className="border-t">
                {categoryPlugins.map((plugin) => {
                  const hasDependencies = plugin.dependencies && plugin.dependencies.length > 0
                  const missingDependencies = plugin.dependencies?.filter(dep => 
                    !plugins.find(p => p.id === dep && p.isEnabled)
                  ) || []
                  
                  return (
                    <div key={plugin.id} className="p-4 border-b last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-foreground">
                              {plugin.name}
                            </h4>
                            <Badge 
                              className={categoryColors[plugin.category as keyof typeof categoryColors]}
                            >
                              {plugin.category}
                            </Badge>
                            <Badge variant="secondary">v{plugin.version}</Badge>
                            {hasDependencies && (
                              <Badge variant="outline">
                                {plugin.dependencies?.length} deps
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {plugin.description}
                          </p>

                                                     {missingDependencies.length > 0 && (
                             <div className="flex items-center space-x-2 text-sm text-amber-600 mb-2">
                               <AlertTriangle className="h-4 w-4" />
                               <span>{t('plugins.missingDependencies')}: {missingDependencies.join(', ')}</span>
                             </div>
                           )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={plugin.isEnabled}
                            disabled={loading || missingDependencies.length > 0}
                            onCheckedChange={() => togglePlugin(plugin.id)}
                          />
                                                     <span className="text-sm text-muted-foreground">
                             {plugin.isEnabled ? t('plugins.enable') : t('plugins.disable')}
                           </span>
                                                     <Button
                             size="sm"
                             variant="outline"
                             onClick={() => setSelectedPlugin(plugin)}
                           >
                             {t('plugins.settings')}
                           </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Plugin Settings Modal */}
      {selectedPlugin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                         <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold">{selectedPlugin.name} {t('plugins.settings')}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPlugin(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              {Object.entries(selectedPlugin.settings || {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                                         <p className="text-xs text-muted-foreground">
                       {typeof value === 'boolean' ? t('plugins.enable') + '/' + t('plugins.disable') + ' ' + t('plugins.description') : t('plugins.settings')}
                     </p>
                  </div>
                  {typeof value === 'boolean' ? (
                    <Switch
                      checked={value as boolean}
                      onCheckedChange={(checked) => {
                        const newSettings = { ...selectedPlugin.settings, [key]: checked }
                        updatePluginSettings(selectedPlugin.id, newSettings)
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(value)}
                      onChange={(e) => {
                        const newSettings = { ...selectedPlugin.settings, [key]: e.target.value }
                        updatePluginSettings(selectedPlugin.id, newSettings)
                      }}
                      className="px-3 py-1 border rounded text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}