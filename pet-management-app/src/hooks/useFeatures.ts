'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { FeatureConfig, ClientFeatureManager } from '@/lib/features-client'

export function useFeatures(userId?: string) {
  const { data: session, status } = useSession()
  const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(new Set())
  const [availableFeatures, setAvailableFeatures] = useState<FeatureConfig[]>([])
  const [loading, setLoading] = useState(true)

  const loadFeatures = useCallback(async () => {
    if (status === 'loading') return
    
    try {
      const currentUserId = userId || session?.user?.id
      const url = currentUserId 
        ? `/api/features?userId=${currentUserId}`
        : '/api/features'
      
      const response = await fetch(url, {
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      
      if (!response.ok) {
        // If unauthorized, don't throw error immediately - session might be refreshing
        if (response.status === 401 && status !== 'unauthenticated') {
          console.warn('Features request unauthorized, but session status is:', status)
          return
        }
        throw new Error('Failed to fetch features')
      }
      
      const data = await response.json()
      const features = data.features
      
      setAvailableFeatures(features)
      setEnabledFeatures(new Set(features.map((f: FeatureConfig) => f.name)))
    } catch (error) {
      console.error('Failed to load features:', error)
      // Don't fail completely - provide default features
      const defaultFeatures = [
        { name: 'dashboard', displayName: 'Dashboard', category: 'core', isCore: true },
        { name: 'pets', displayName: 'Pet Management', category: 'core', isCore: true },
        { name: 'settings', displayName: 'Settings', category: 'core', isCore: true }
      ]
      setAvailableFeatures(defaultFeatures)
      setEnabledFeatures(new Set(defaultFeatures.map(f => f.name)))
    } finally {
      setLoading(false)
    }
  }, [status, userId, session?.user?.id])

  useEffect(() => {
    loadFeatures()
  }, [loadFeatures])

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