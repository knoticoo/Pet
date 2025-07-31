import { prisma } from '@/lib/prisma'

export interface FeatureConfig {
  id: string
  name: string
  displayName: string
  description?: string
  category: 'core' | 'health' | 'finance' | 'social' | 'advanced'
  isCore: boolean
  version: string
  component?: React.ComponentType<any>
  routes?: string[]
  permissions?: string[]
  dependencies?: string[]
  config?: Record<string, any>
}

export interface PluginManifest {
  name: string
  displayName: string
  description: string
  version: string
  category: string
  isCore: boolean
  dependencies: string[]
  routes: Array<{
    path: string
    component: string
    permissions?: string[]
  }>
  navigation?: Array<{
    name: string
    href: string
    icon: string
    permissions?: string[]
  }>
  config?: Record<string, any>
}

// Core features that are always available
export const CORE_FEATURES: FeatureConfig[] = [
  {
    id: 'dashboard',
    name: 'dashboard',
    displayName: 'Dashboard',
    description: 'Main dashboard with overview statistics',
    category: 'core',
    isCore: true,
    version: '1.0.0',
    routes: ['/'],
  },
  {
    id: 'pets',
    name: 'pets',
    displayName: 'Pet Management',
    description: 'Manage pet profiles and basic information',
    category: 'core',
    isCore: true,
    version: '1.0.0',
    routes: ['/pets', '/pets/new', '/pets/[id]'],
  },
  {
    id: 'settings',
    name: 'settings',
    displayName: 'Settings',
    description: 'Application settings and preferences',
    category: 'core',
    isCore: true,
    version: '1.0.0',
    routes: ['/settings'],
  }
]

// Available plugins/features
export const AVAILABLE_FEATURES: FeatureConfig[] = [
  {
    id: 'health-tracking',
    name: 'health-tracking',
    displayName: 'Health Tracking',
    description: 'Track vaccinations, vet visits, and medical records',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/health', '/health/vaccinations', '/health/records'],
    dependencies: ['pets']
  },
  {
    id: 'appointments',
    name: 'appointments',
    displayName: 'Appointments',
    description: 'Schedule and manage vet appointments',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/appointments', '/appointments/new', '/appointments/[id]'],
    dependencies: ['pets']
  },
  {
    id: 'medications',
    name: 'medications',
    displayName: 'Medications',
    description: 'Track medications and dosage schedules',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/medications', '/medications/new'],
    dependencies: ['pets', 'health-tracking']
  },
  {
    id: 'expenses',
    name: 'expenses',
    displayName: 'Expense Tracking',
    description: 'Track pet-related expenses and generate reports',
    category: 'finance',
    isCore: false,
    version: '1.0.0',
    routes: ['/expenses', '/expenses/new', '/expenses/reports'],
    dependencies: ['pets']
  },
  {
    id: 'feeding-schedule',
    name: 'feeding-schedule',
    displayName: 'Feeding Schedule',
    description: 'Manage feeding times and dietary requirements',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/feeding', '/feeding/schedule'],
    dependencies: ['pets']
  },
  {
    id: 'activities',
    name: 'activities',
    displayName: 'Activity Tracking',
    description: 'Track walks, exercise, and daily activities',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/activities', '/activities/new'],
    dependencies: ['pets']
  },
  {
    id: 'documents',
    name: 'documents',
    displayName: 'Document Management',
    description: 'Store and organize pet documents and certificates',
    category: 'advanced',
    isCore: false,
    version: '1.0.0',
    routes: ['/documents', '/documents/upload'],
    dependencies: ['pets']
  },
  {
    id: 'reminders',
    name: 'reminders',
    displayName: 'Reminders & Notifications',
    description: 'Set up automated reminders for important tasks',
    category: 'advanced',
    isCore: false,
    version: '1.0.0',
    routes: ['/reminders', '/reminders/new'],
    dependencies: ['pets']
  },
  {
    id: 'social-profile',
    name: 'social-profile',
    displayName: 'Social Profiles',
    description: 'Share pet profiles and connect with other pet owners',
    category: 'social',
    isCore: false,
    version: '1.0.0',
    routes: ['/social', '/social/profile', '/social/connect'],
    dependencies: ['pets']
  },
  {
    id: 'lost-pet-alerts',
    name: 'lost-pet-alerts',
    displayName: 'Lost Pet Alerts',
    description: 'Report lost pets and help find missing animals',
    category: 'social',
    isCore: false,
    version: '1.0.0',
    routes: ['/lost-pets', '/lost-pets/report'],
    dependencies: ['pets', 'social-profile']
  }
]

export class FeatureManager {
  private static instance: FeatureManager
  private enabledFeatures: Set<string> = new Set()
  private userFeatures: Map<string, Set<string>> = new Map()

  static getInstance(): FeatureManager {
    if (!FeatureManager.instance) {
      FeatureManager.instance = new FeatureManager()
    }
    return FeatureManager.instance
  }

  async initializeFeatures() {
    try {
      // Ensure all features exist in database
      for (const feature of [...CORE_FEATURES, ...AVAILABLE_FEATURES]) {
        await prisma.feature.upsert({
          where: { name: feature.name },
          update: {
            displayName: feature.displayName,
            description: feature.description,
            category: feature.category,
            version: feature.version,
            config: JSON.stringify(feature.config || {})
          },
          create: {
            name: feature.name,
            displayName: feature.displayName,
            description: feature.description,
            category: feature.category,
            isEnabled: true,
            isCore: feature.isCore,
            version: feature.version,
            config: JSON.stringify(feature.config || {})
          }
        })
      }

      // Load enabled features
      const features = await prisma.feature.findMany({
        where: { isEnabled: true }
      })

      this.enabledFeatures = new Set(features.map(f => f.name))
    } catch (error) {
      console.error('Failed to initialize features:', error)
    }
  }

  async getEnabledFeatures(): Promise<FeatureConfig[]> {
    const allFeatures = [...CORE_FEATURES, ...AVAILABLE_FEATURES]
    return allFeatures.filter(feature => 
      feature.isCore || this.enabledFeatures.has(feature.name)
    )
  }

  async getUserEnabledFeatures(userId: string): Promise<FeatureConfig[]> {
    try {
      const userFeatures = await prisma.userFeature.findMany({
        where: { 
          userId,
          isEnabled: true 
        },
        include: { feature: true }
      })

      const enabledFeatureNames = new Set([
        ...CORE_FEATURES.map(f => f.name), // Core features always enabled
        ...userFeatures.map(uf => uf.feature.name)
      ])

      const allFeatures = [...CORE_FEATURES, ...AVAILABLE_FEATURES]
      return allFeatures.filter(feature => enabledFeatureNames.has(feature.name))
    } catch (error) {
      console.error('Failed to get user features:', error)
      return CORE_FEATURES // Return only core features on error
    }
  }

  async enableFeature(featureName: string, userId?: string): Promise<boolean> {
    try {
      if (userId) {
        // Enable for specific user
        const feature = await prisma.feature.findUnique({
          where: { name: featureName }
        })

        if (!feature) return false

        await prisma.userFeature.upsert({
          where: {
            userId_featureId: {
              userId,
              featureId: feature.id
            }
          },
          update: { isEnabled: true },
          create: {
            userId,
            featureId: feature.id,
            isEnabled: true
          }
        })
      } else {
        // Enable globally
        await prisma.feature.update({
          where: { name: featureName },
          data: { isEnabled: true }
        })
        this.enabledFeatures.add(featureName)
      }

      return true
    } catch (error) {
      console.error('Failed to enable feature:', error)
      return false
    }
  }

  async disableFeature(featureName: string, userId?: string): Promise<boolean> {
    try {
      const feature = [...CORE_FEATURES, ...AVAILABLE_FEATURES].find(f => f.name === featureName)
      if (feature?.isCore) {
        return false // Cannot disable core features
      }

      if (userId) {
        // Disable for specific user
        const feature = await prisma.feature.findUnique({
          where: { name: featureName }
        })

        if (!feature) return false

        await prisma.userFeature.upsert({
          where: {
            userId_featureId: {
              userId,
              featureId: feature.id
            }
          },
          update: { isEnabled: false },
          create: {
            userId,
            featureId: feature.id,
            isEnabled: false
          }
        })
      } else {
        // Disable globally
        await prisma.feature.update({
          where: { name: featureName },
          data: { isEnabled: false }
        })
        this.enabledFeatures.delete(featureName)
      }

      return true
    } catch (error) {
      console.error('Failed to disable feature:', error)
      return false
    }
  }

  isFeatureEnabled(featureName: string, userId?: string): boolean {
    const feature = [...CORE_FEATURES, ...AVAILABLE_FEATURES].find(f => f.name === featureName)
    if (feature?.isCore) return true

    if (userId && this.userFeatures.has(userId)) {
      return this.userFeatures.get(userId)!.has(featureName)
    }

    return this.enabledFeatures.has(featureName)
  }

  getAvailableRoutes(userId?: string): string[] {
    const enabledFeatures = userId 
      ? this.getUserEnabledFeatures(userId)
      : this.getEnabledFeatures()

    return enabledFeatures.then(features => 
      features.flatMap(feature => feature.routes || [])
    ) as any
  }

  validateDependencies(featureName: string): boolean {
    const feature = AVAILABLE_FEATURES.find(f => f.name === featureName)
    if (!feature?.dependencies) return true

    return feature.dependencies.every(dep => 
      this.enabledFeatures.has(dep) || 
      CORE_FEATURES.some(cf => cf.name === dep)
    )
  }
}

export const featureManager = FeatureManager.getInstance()