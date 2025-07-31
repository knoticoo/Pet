'use client'

import { useState, useEffect } from 'react'
import { featureManager, FeatureConfig } from '@/lib/features'

export function useFeatures(userId?: string) {
  const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(new Set())
  const [availableFeatures, setAvailableFeatures] = useState<FeatureConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false) // In a real app, this would come from user context

  useEffect(() => {
    loadFeatures()
  }, [userId])

  const loadFeatures = async () => {
    try {
      await featureManager.initializeFeatures()
      
      const features = userId 
        ? await featureManager.getUserEnabledFeatures(userId)
        : await featureManager.getEnabledFeatures()
      
      setAvailableFeatures(features)
      setEnabledFeatures(new Set(features.map(f => f.name)))
      
      // Mock admin check - in a real app, this would check user permissions
      setIsAdmin(true) // For demo purposes, always admin
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
    loading,
    isAdmin,
    isFeatureEnabled,
    hasPermission,
    getFeatureConfig,
    refreshFeatures
  }
}