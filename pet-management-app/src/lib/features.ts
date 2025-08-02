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
    isCore: true,
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
  },
  // New innovative plugins
  {
    id: 'ai-health-insights',
    name: 'ai-health-insights',
    displayName: 'AI Health Insights',
    description: 'AI-powered health analysis and recommendations based on pet data',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/ai-insights', '/ai-insights/analysis'],
    dependencies: ['pets', 'health-tracking']
  },
  {
    id: 'photo-timeline',
    name: 'photo-timeline',
    displayName: 'Photo Timeline',
    description: 'Visual timeline of your pet\'s growth and memorable moments',
    category: 'social',
    isCore: false,
    version: '1.0.0',
    routes: ['/photos', '/photos/timeline', '/photos/upload'],
    dependencies: ['pets']
  },
  {
    id: 'weather-activity-alerts',
    name: 'weather-activity-alerts',
    displayName: 'Weather Activity Alerts',
    description: 'Weather-based activity recommendations and safety alerts',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/weather-alerts', '/weather-alerts/settings'],
    dependencies: ['pets', 'activities']
  },
  {
    id: 'breed-specific-care',
    name: 'breed-specific-care',
    displayName: 'Breed-Specific Care Guide',
    description: 'Customized care recommendations based on your pet\'s breed',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/breed-care', '/breed-care/recommendations'],
    dependencies: ['pets']
  },
  {
    id: 'emergency-contacts',
    name: 'emergency-contacts',
    displayName: 'Emergency Contacts & Protocols',
    description: 'Quick access to emergency vets and first-aid protocols',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/emergency', '/emergency/contacts', '/emergency/protocols'],
    dependencies: ['pets']
  },
  {
    id: 'pet-insurance-tracker',
    name: 'pet-insurance-tracker',
    displayName: 'Pet Insurance Tracker',
    description: 'Track insurance claims, coverage, and reimbursements',
    category: 'finance',
    isCore: false,
    version: '1.0.0',
    routes: ['/insurance', '/insurance/claims', '/insurance/coverage'],
    dependencies: ['pets', 'expenses']
  },
  {
    id: 'training-progress',
    name: 'training-progress',
    displayName: 'Training Progress Tracker',
    description: 'Track training sessions, commands learned, and behavioral progress',
    category: 'advanced',
    isCore: false,
    version: '1.0.0',
    routes: ['/training', '/training/sessions', '/training/progress'],
    dependencies: ['pets']
  },
  {
    id: 'multi-pet-comparison',
    name: 'multi-pet-comparison',
    displayName: 'Multi-Pet Comparison',
    description: 'Compare health metrics, expenses, and activities across pets',
    category: 'advanced',
    isCore: false,
    version: '1.0.0',
    routes: ['/comparison', '/comparison/health', '/comparison/expenses'],
    dependencies: ['pets']
  },
  {
    id: 'vet-telemedicine',
    name: 'vet-telemedicine',
    displayName: 'Telemedicine Integration',
    description: 'Schedule virtual vet consultations and video calls',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/telemedicine', '/telemedicine/appointments'],
    dependencies: ['pets', 'appointments']
  },
  {
    id: 'microchip-registry',
    name: 'microchip-registry',
    displayName: 'Microchip Registry',
    description: 'Track and manage pet microchip information and registrations',
    category: 'advanced',
    isCore: false,
    version: '1.0.0',
    routes: ['/microchip', '/microchip/register'],
    dependencies: ['pets', 'documents']
  },
  {
    id: 'grooming-scheduler',
    name: 'grooming-scheduler',
    displayName: 'Grooming Scheduler',
    description: 'Schedule grooming appointments and track grooming history',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/grooming', '/grooming/schedule', '/grooming/history'],
    dependencies: ['pets', 'appointments']
  },
  {
    id: 'nutrition-calculator',
    name: 'nutrition-calculator',
    displayName: 'Nutrition Calculator',
    description: 'Calculate optimal nutrition and calorie requirements for your pet',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/nutrition', '/nutrition/calculator', '/nutrition/plans'],
    dependencies: ['pets', 'feeding-schedule']
  },
  {
    id: 'pet-community',
    name: 'pet-community',
    displayName: 'Pet Community Forum',
    description: 'Connect with other pet owners, share experiences, and get advice',
    category: 'social',
    isCore: false,
    version: '1.0.0',
    routes: ['/community', '/community/forums', '/community/groups'],
    dependencies: ['pets', 'social-profile']
  },
  {
    id: 'gps-tracking',
    name: 'gps-tracking',
    displayName: 'GPS Pet Tracking',
    description: 'Track your pet\'s location and set safe zone alerts',
    category: 'advanced',
    isCore: false,
    version: '1.0.0',
    routes: ['/gps-tracking', '/gps-tracking/map', '/gps-tracking/alerts'],
    dependencies: ['pets']
  },
  {
    id: 'age-calculator',
    name: 'age-calculator',
    displayName: 'Pet Age Calculator',
    description: 'Calculate your pet\'s age in human years and life stage insights',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/age-calculator'],
    dependencies: ['pets']
  },
  {
    id: 'seasonal-care-tips',
    name: 'seasonal-care-tips',
    displayName: 'Seasonal Care Tips',
    description: 'Season-specific care recommendations and reminders',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/seasonal-care', '/seasonal-care/tips'],
    dependencies: ['pets', 'reminders']
  },
  {
    id: 'expense-analytics',
    name: 'expense-analytics',
    displayName: 'Advanced Expense Analytics',
    description: 'Detailed expense analytics, budgeting, and cost predictions',
    category: 'finance',
    isCore: false,
    version: '1.0.0',
    routes: ['/expense-analytics', '/expense-analytics/reports', '/expense-analytics/budgets'],
    dependencies: ['pets', 'expenses']
  },
  {
    id: 'health-reports',
    name: 'health-reports',
    displayName: 'Health Report Generator',
    description: 'Generate comprehensive health reports for vet visits',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/health-reports', '/health-reports/generate'],
    dependencies: ['pets', 'health-tracking', 'appointments']
  },
  {
    id: 'smart-reminders',
    name: 'smart-reminders',
    displayName: 'Smart Reminders AI',
    description: 'AI-powered smart reminders based on pet behavior and patterns',
    category: 'advanced',
    isCore: false,
    version: '1.0.0',
    routes: ['/smart-reminders', '/smart-reminders/ai-insights'],
    dependencies: ['pets', 'reminders', 'ai-health-insights']
  },
  {
    id: 'backup-restore',
    name: 'backup-restore',
    displayName: 'Data Backup & Restore',
    description: 'Backup and restore your pet data with cloud sync',
    category: 'advanced',
    isCore: false,
    version: '1.0.0',
    routes: ['/backup', '/backup/restore', '/backup/settings'],
    dependencies: ['pets']
  },
  {
    id: 'ai-vet',
    name: 'ai-vet',
    displayName: 'AI Veterinarian',
    description: 'AI-powered veterinary consultations and health advice',
    category: 'health',
    isCore: false,
    version: '1.0.0',
    routes: ['/ai-vet', '/ai-vet/consultation', '/ai-vet/history'],
    dependencies: ['pets']
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

  async getUserEnabledFeatures(_userId: string): Promise<FeatureConfig[]> {
    try {
      // Get user subscription info to determine feature access
      // Note: User subscription info is used for AI service limitations, not feature access
      // All features are available in navigation, but AI usage is limited
      const allFeatures = [...CORE_FEATURES, ...AVAILABLE_FEATURES]
      
      // For now, return all features - AI limitations are handled in the AI service
      return allFeatures
    } catch (error) {
      console.error('Failed to get user features:', error)
      // Return all features on error to avoid breaking the UI
      return [...CORE_FEATURES, ...AVAILABLE_FEATURES]
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

  getAvailableRoutes(userId?: string): Promise<string[]> {
    const enabledFeatures = userId 
      ? this.getUserEnabledFeatures(userId)
      : this.getEnabledFeatures()

    return enabledFeatures.then(features => 
      features.flatMap(feature => feature.routes || [])
    )
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