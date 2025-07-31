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
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { CORE_FEATURES, AVAILABLE_FEATURES, FeatureConfig } from '@/lib/features-client'

interface FeatureStatus {
  name: string
  isEnabled: boolean
  isCore: boolean
  category: string
  dependencies?: string[]
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
  const [features, setFeatures] = useState<FeatureStatus[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core']))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeatures()
  }, [])

  const loadFeatures = async () => {
    try {
      // In a real app, this would fetch from your API
      // For now, we'll use the static feature definitions
      const allFeatures = [...CORE_FEATURES, ...AVAILABLE_FEATURES]
      const featureStatuses: FeatureStatus[] = allFeatures.map(feature => ({
        name: feature.name,
        isEnabled: feature.isCore || Math.random() > 0.3, // Mock some as disabled
        isCore: feature.isCore,
        category: feature.category,
        dependencies: feature.dependencies
      }))
      
      setFeatures(featureStatuses)
    } catch (error) {
      console.error('Failed to load features:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFeature = async (featureName: string) => {
    const feature = features.find(f => f.name === featureName)
    if (!feature || feature.isCore) return

    try {
      // In a real app, this would call your API
      const response = await fetch('/api/admin/features/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          featureName, 
          enable: !feature.isEnabled 
        })
      })

      if (response.ok) {
        setFeatures(prev => prev.map(f => 
          f.name === featureName 
            ? { ...f, isEnabled: !f.isEnabled }
            : f
        ))
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error)
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

  const getFeatureConfig = (featureName: string): FeatureConfig | undefined => {
    return [...CORE_FEATURES, ...AVAILABLE_FEATURES].find(f => f.name === featureName)
  }

  const checkDependencies = (feature: FeatureStatus): { satisfied: boolean, missing: string[] } => {
    if (!feature.dependencies) return { satisfied: true, missing: [] }
    
    const missing = feature.dependencies.filter(dep => {
      const depFeature = features.find(f => f.name === dep)
      return !depFeature?.isEnabled
    })
    
    return { satisfied: missing.length === 0, missing }
  }

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = []
    }
    acc[feature.category].push(feature)
    return acc
  }, {} as Record<string, FeatureStatus[]>)

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading features...</div>
  }

  return (
    <div className="space-y-6">
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
                  const config = getFeatureConfig(feature.name)
                  const { satisfied, missing } = checkDependencies(feature)
                  
                  return (
                    <div key={feature.name} className="p-4 border-b last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-foreground">
                              {config?.displayName || feature.name}
                            </h4>
                            <Badge 
                              className={categoryColors[feature.category as keyof typeof categoryColors]}
                            >
                              {feature.category}
                            </Badge>
                            {feature.isCore && (
                              <Badge variant="outline">Core</Badge>
                            )}
                            {config?.version && (
                              <Badge variant="secondary">v{config.version}</Badge>
                            )}
                          </div>
                          
                          {config?.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {config.description}
                            </p>
                          )}
                          
                          {feature.dependencies && feature.dependencies.length > 0 && (
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-xs text-muted-foreground">Depends on:</span>
                              {feature.dependencies.map(dep => (
                                <Badge key={dep} variant="outline" className="text-xs">
                                  {dep}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {!satisfied && (
                            <div className="flex items-center space-x-2 text-yellow-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm">
                                Missing dependencies: {missing.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={feature.isEnabled}
                            disabled={feature.isCore || (!satisfied && !feature.isEnabled)}
                            onCheckedChange={() => toggleFeature(feature.name)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {feature.isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
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
        <Button variant="outline" size="sm">
          Enable All Non-Core
        </Button>
        <Button variant="outline" size="sm">
          Disable All Optional
        </Button>
        <Button variant="outline" size="sm">
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}