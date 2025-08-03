'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { FeatureConfig, ClientFeatureManager } from '@/lib/features-client'

// Cache for features to avoid unnecessary API calls
const featuresCache = new Map<string, { features: FeatureConfig[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useFeatures(userId?: string) {
  const { data: session, status } = useSession()
  const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(new Set())
  const [availableFeatures, setAvailableFeatures] = useState<FeatureConfig[]>([])
  const [loading, setLoading] = useState(true)

  // Memoize the cache key to avoid recreating it on every render
  const cacheKey = useMemo(() => {
    return userId || (session?.user as { id?: string })?.id || 'anonymous'
  }, [userId, session?.user])

  const loadFeatures = useCallback(async () => {
    if (status === 'loading') return
    
    // Check cache first
    const cached = featuresCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setAvailableFeatures(cached.features)
      setEnabledFeatures(new Set(cached.features.map((f: FeatureConfig) => f.name)))
      setLoading(false)
      return
    }
    
    try {
      const currentUserId = userId || (session?.user as { id?: string })?.id
      const url = currentUserId 
        ? `/api/features?userId=${currentUserId}`
        : '/api/features'
      
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'max-age=300', // 5 minutes client-side cache
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
      
      // Update cache
      featuresCache.set(cacheKey, { features, timestamp: Date.now() })
      
      setAvailableFeatures(features)
      setEnabledFeatures(new Set(features.map((f: FeatureConfig) => f.name)))
    } catch (error) {
      console.error('Failed to load features:', error)
      // Don't fail completely - provide default features
      const defaultFeatures: FeatureConfig[] = [
        { id: 'dashboard', name: 'dashboard', displayName: 'Dashboard', category: 'core', isCore: true, version: '1.0.0' },
        { id: 'pets', name: 'pets', displayName: 'Pet Management', category: 'core', isCore: true, version: '1.0.0' },
        { id: 'social-profile', name: 'social-profile', displayName: 'Social Profiles', category: 'social', isCore: true, version: '1.0.0' },
        { id: 'expenses', name: 'expenses', displayName: 'Expenses', category: 'finance', isCore: true, version: '1.0.0' },
        { id: 'appointments', name: 'appointments', displayName: 'Appointments', category: 'health', isCore: true, version: '1.0.0' },
        { id: 'reminders', name: 'reminders', displayName: 'Reminders', category: 'health', isCore: true, version: '1.0.0' },
        { id: 'settings', name: 'settings', displayName: 'Settings', category: 'core', isCore: true, version: '1.0.0' }
      ]
      setAvailableFeatures(defaultFeatures)
      setEnabledFeatures(new Set(defaultFeatures.map(f => f.name)))
    } finally {
      setLoading(false)
    }
  }, [status, cacheKey, userId, session?.user])

  useEffect(() => {
    loadFeatures()
  }, [loadFeatures])

  // Memoize expensive calculations
  const memoizedValues = useMemo(() => ({
    isFeatureEnabled: (featureName: string): boolean => {
      return ClientFeatureManager.isFeatureEnabled(featureName, enabledFeatures)
    },

    hasPermission: (featureName: string): boolean => {
      if (!ClientFeatureManager.isFeatureEnabled(featureName, enabledFeatures)) return false
      
      // In a real app, you would check specific permissions here
      // For now, just return true if feature is enabled
      return true
    },

    getFeatureConfig: (featureName: string): FeatureConfig | undefined => {
      return ClientFeatureManager.getFeatureConfig(featureName)
    },

    refreshFeatures: () => {
      // Clear cache and reload
      featuresCache.delete(cacheKey)
      loadFeatures()
    }
  }), [enabledFeatures, cacheKey, loadFeatures])

  return {
    enabledFeatures,
    availableFeatures,
    loading: loading || status === 'loading',
    isAdmin: (session?.user as { isAdmin?: boolean })?.isAdmin || false,
    isAuthenticated: !!session,
    user: session?.user,
    ...memoizedValues
  }
}