'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { featureManager, FeatureConfig } from '@/lib/features'

export function useFeatures(userId?: string) {
  const { data: session, status } = useSession()
  const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(new Set())
  const [availableFeatures, setAvailableFeatures] = useState<FeatureConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeatures()
  }, [userId, session, status])

  const loadFeatures = async () => {
    if (status === 'loading') return
    
    try {
      await featureManager.initializeFeatures()
      
      const currentUserId = userId || session?.user?.id
      const features = currentUserId 
        ? await featureManager.getUserEnabledFeatures(currentUserId)
        : await featureManager.getEnabledFeatures()
      
      setAvailableFeatures(features)
      setEnabledFeatures(new Set(features.map(f => f.name)))
    } catch (error) {
      console.error('Failed to load features:', error)
    } finally {
      setLoading(false)
    }
  }

  const isFeatureEnabled = (featureName: string): boolean => {
    return enabledFeatures.has(featureName)
  }

  const hasPermission = (featureName: string, permission?: string): boolean => {
    if (!isFeatureEnabled(featureName)) return false
    
    // In a real app, you would check specific permissions here
    // For now, just return true if feature is enabled
    return true
  }

  const getFeatureConfig = (featureName: string): FeatureConfig | undefined => {
    return availableFeatures.find(f => f.name === featureName)
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