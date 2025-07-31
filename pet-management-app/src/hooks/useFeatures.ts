'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { FeatureConfig, ClientFeatureManager } from '@/lib/features-client'

export function useFeatures(userId?: string) {
  const { data: session, status } = useSession()
  const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(new Set())
  const [availableFeatures, setAvailableFeatures] = useState<FeatureConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeatures()
  }, [userId, session, status, loadFeatures])

  const loadFeatures = useCallback(async () => {
    if (status === 'loading') return
    
    try {
      const currentUserId = userId || session?.user?.id
      const url = currentUserId 
        ? `/api/features?userId=${currentUserId}`
        : '/api/features'
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch features')
      }
      
      const data = await response.json()
      const features = data.features
      
      setAvailableFeatures(features)
      setEnabledFeatures(new Set(features.map((f: FeatureConfig) => f.name)))
    } catch (error) {
      console.error('Failed to load features:', error)
    } finally {
      setLoading(false)
    }
  }, [status, userId, session?.user?.id])

  const isFeatureEnabled = (featureName: string): boolean => {
    return ClientFeatureManager.isFeatureEnabled(featureName, enabledFeatures)
  }

  const hasPermission = (featureName: string, _permission?: string): boolean => {
    if (!isFeatureEnabled(featureName)) return false
    
    // In a real app, you would check specific permissions here
    // For now, just return true if feature is enabled
    return true
  }

  const getFeatureConfig = (featureName: string): FeatureConfig | undefined => {
    return ClientFeatureManager.getFeatureConfig(featureName)
  }

  const refreshFeatures = () => {
    loadFeatures()
  }

  return {
    enabledFeatures,
    availableFeatures,
    loading: loading || status === 'loading',
    isAdmin: session?.user?.isAdmin || false,
    isAuthenticated: !!session,
    user: session?.user,
    isFeatureEnabled,
    hasPermission,
    getFeatureConfig,
    refreshFeatures
  }
}