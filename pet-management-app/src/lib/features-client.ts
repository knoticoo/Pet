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

// Client-side feature utilities
export class ClientFeatureManager {
  static isFeatureEnabled(featureName: string, enabledFeatures: Set<string>): boolean {
    const feature = [...CORE_FEATURES, ...AVAILABLE_FEATURES].find(f => f.name === featureName)
    if (feature?.isCore) return true
    return enabledFeatures.has(featureName)
  }

  static getFeatureConfig(featureName: string): FeatureConfig | undefined {
    return [...CORE_FEATURES, ...AVAILABLE_FEATURES].find(f => f.name === featureName)
  }

  static validateDependencies(featureName: string, enabledFeatures: Set<string>): boolean {
    const feature = AVAILABLE_FEATURES.find(f => f.name === featureName)
    if (!feature?.dependencies) return true

    return feature.dependencies.every(dep => 
      enabledFeatures.has(dep) || 
      CORE_FEATURES.some(cf => cf.name === dep)
    )
  }
}