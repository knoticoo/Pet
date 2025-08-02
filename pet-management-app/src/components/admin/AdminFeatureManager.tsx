'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Puzzle, 
  Heart, 
  DollarSign, 
  Users, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  CheckCircle,
  Clock,
  Trash2
} from 'lucide-react'

interface Feature {
  id: string
  name: string
  displayName: string
  description?: string
  category: string
  isEnabled: boolean
  isCore: boolean
  version: string
}

const categoryIcons = {
  core: Settings,
  health: Heart,
  finance: DollarSign,
  social: Users,
  advanced: Puzzle
}

const categoryColors = {
  core: 'bg-blue-100 text-blue-800',
  health: 'bg-green-100 text-green-800',
  finance: 'bg-yellow-100 text-yellow-800',
  social: 'bg-purple-100 text-purple-800',
  advanced: 'bg-gray-100 text-gray-800'
}

export function AdminFeatureManager() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core']))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFeatures()
  }, [])

  const loadFeatures = async () => {
    try {
      const response = await fetch('/api/admin/features')
      if (response.ok) {
        const data = await response.json()
        setFeatures(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load features')
      }
    } catch {
      setError('An error occurred while fetching features')
    } finally {
      setLoading(false)
    }
  }

  const toggleFeature = async (featureId: string) => {
    const feature = features.find(f => f.id === featureId)
    if (!feature || feature.isCore) return

    try {
      const response = await fetch(`/api/admin/features/${featureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !feature.isEnabled })
      })

      if (response.ok) {
        const updatedFeature = await response.json()
        setFeatures(prev => prev.map(f => 
          f.id === featureId ? updatedFeature : f
        ))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to toggle feature')
      }
    } catch {
      setError('An error occurred while toggling feature')
    }
  }

  const deleteFeature = async (featureId: string) => {
    const feature = features.find(f => f.id === featureId)
    if (!feature || feature.isCore) return

    if (!confirm(`Are you sure you want to delete the feature "${feature.displayName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/features/${featureId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setFeatures(prev => prev.filter(f => f.id !== featureId))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete feature')
      }
    } catch {
      setError('An error occurred while deleting feature')
    }
  }

  const performBulkAction = async (action: string) => {
    try {
      const response = await fetch('/api/admin/features/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        // Reload features after bulk action
        await loadFeatures()
        // You could show a success message here
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to perform bulk action')
      }
    } catch {
      setError('An error occurred while performing bulk action')
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

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = []
    }
    acc[feature.category].push(feature)
    return acc
  }, {} as Record<string, Feature[]>)

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading features...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Active</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {features.filter(f => f.isEnabled).length}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Disabled</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {features.filter(f => !f.isEnabled).length}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Core</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {features.filter(f => f.isCore).length}
          </div>
        </div>
      </div>

      {/* Feature Categories */}
      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
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
                  {categoryFeatures.length} features
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
                {categoryFeatures.map((feature) => {
                  return (
                    <div key={feature.id} className="p-4 border-b last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-foreground">
                              {feature.displayName}
                            </h4>
                            <Badge 
                              className={categoryColors[feature.category as keyof typeof categoryColors]}
                            >
                              {feature.category}
                            </Badge>
                            {feature.isCore && (
                              <Badge variant="outline">Core</Badge>
                            )}
                            <Badge variant="secondary">v{feature.version}</Badge>
                          </div>
                          
                          {feature.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {feature.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={feature.isEnabled}
                            disabled={feature.isCore}
                            onCheckedChange={() => toggleFeature(feature.id)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {feature.isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                          {!feature.isCore && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteFeature(feature.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Bulk Actions */}
      <div className="flex space-x-4 pt-4 border-t">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => performBulkAction('enable-all-non-core')}
        >
          Enable All Non-Core
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => performBulkAction('disable-all-optional')}
        >
          Disable All Optional
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => performBulkAction('reset-to-defaults')}
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}