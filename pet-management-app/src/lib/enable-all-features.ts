import { prisma } from '@/lib/prisma'

// List of features that should be enabled by default (matching your PWA)
const FEATURES_TO_ENABLE = [
  'dashboard',
  'pets', 
  'appointments',
  'expenses',
  'reminders',
  'ai-vet',
  'social-profile',
  'settings',
  'admin',
  'health-tracking',
  'medications',
  'feeding-schedule',
  'activities',
  'documents',
  'lost-pet-alerts',
  'ai-health-insights',
  'photo-timeline',
  'weather-activity-alerts',
  'breed-specific-care',
  'emergency-contacts',
  'pet-insurance-tracker',
  'training-progress',
  'multi-pet-comparison',
  'vet-telemedicine',
  'microchip-registry',
  'grooming-scheduler',
  'backup-sync'
]

export async function enableAllFeatures() {
  console.log('🔧 Enabling all features...')
  
  try {
    for (const featureName of FEATURES_TO_ENABLE) {
      await prisma.feature.upsert({
        where: { name: featureName },
        update: {
          isEnabled: true,
          displayName: getFeatureDisplayName(featureName),
          description: getFeatureDescription(featureName),
          category: getFeatureCategory(featureName),
          isCore: isCoreFeature(featureName),
          version: '1.0.0'
        },
        create: {
          name: featureName,
          displayName: getFeatureDisplayName(featureName),
          description: getFeatureDescription(featureName),
          category: getFeatureCategory(featureName),
          isEnabled: true,
          isCore: isCoreFeature(featureName),
          version: '1.0.0',
          config: '{}'
        }
      })
      console.log(`✅ Enabled feature: ${featureName}`)
    }
    
    console.log('🎉 All features enabled successfully!')
  } catch (error) {
    console.error('❌ Error enabling features:', error)
    throw error
  }
}

function getFeatureDisplayName(featureName: string): string {
  const displayNames: Record<string, string> = {
    'dashboard': 'Dashboard',
    'pets': 'Pet Management',
    'appointments': 'Appointments',
    'expenses': 'Expense Tracking',
    'reminders': 'Reminders & Notifications',
    'ai-vet': 'AI Veterinarian',
    'social-profile': 'Social Profiles',
    'settings': 'Settings',
    'admin': 'Administration',
    'health-tracking': 'Health Tracking',
    'medications': 'Medications',
    'feeding-schedule': 'Feeding Schedule',
    'activities': 'Activity Tracking',
    'documents': 'Document Management',
    'lost-pet-alerts': 'Lost Pet Alerts',
    'ai-health-insights': 'AI Health Insights',
    'photo-timeline': 'Photo Timeline',
    'weather-activity-alerts': 'Weather Activity Alerts',
    'breed-specific-care': 'Breed-Specific Care Guide',
    'emergency-contacts': 'Emergency Contacts & Protocols',
    'pet-insurance-tracker': 'Pet Insurance Tracker',
    'training-progress': 'Training Progress Tracker',
    'multi-pet-comparison': 'Multi-Pet Comparison',
    'vet-telemedicine': 'Telemedicine Integration',
    'microchip-registry': 'Microchip Registry',
    'grooming-scheduler': 'Grooming Scheduler',
    'backup-sync': 'Backup & Sync'
  }
  
  return displayNames[featureName] || featureName
}

function getFeatureDescription(featureName: string): string {
  const descriptions: Record<string, string> = {
    'dashboard': 'Main dashboard with overview statistics',
    'pets': 'Manage pet profiles and basic information',
    'appointments': 'Schedule and manage vet appointments',
    'expenses': 'Track pet-related expenses and generate reports',
    'reminders': 'Set up automated reminders for important tasks',
    'ai-vet': 'AI-powered veterinary consultations and health advice',
    'social-profile': 'Share pet profiles and connect with other pet owners',
    'settings': 'Application settings and preferences',
    'admin': 'Administrative panel for system management',
    'health-tracking': 'Track vaccinations, vet visits, and medical records',
    'medications': 'Track medications and dosage schedules',
    'feeding-schedule': 'Manage feeding times and dietary requirements',
    'activities': 'Track walks, exercise, and daily activities',
    'documents': 'Store and organize pet documents and certificates',
    'lost-pet-alerts': 'Report lost pets and help find missing animals',
    'ai-health-insights': 'AI-powered health analysis and recommendations',
    'photo-timeline': 'Visual timeline of your pet\'s growth and memorable moments',
    'weather-activity-alerts': 'Weather-based activity recommendations and safety alerts',
    'breed-specific-care': 'Customized care recommendations based on your pet\'s breed',
    'emergency-contacts': 'Quick access to emergency vets and first-aid protocols',
    'pet-insurance-tracker': 'Track insurance claims, coverage, and reimbursements',
    'training-progress': 'Track training sessions, commands learned, and behavioral progress',
    'multi-pet-comparison': 'Compare health metrics, expenses, and activities across pets',
    'vet-telemedicine': 'Schedule virtual vet consultations and video calls',
    'microchip-registry': 'Track and manage pet microchip information and registrations',
    'grooming-scheduler': 'Schedule grooming appointments and track grooming history',
    'backup-sync': 'Backup and restore your pet data with cloud sync'
  }
  
  return descriptions[featureName] || 'Feature description'
}

function getFeatureCategory(featureName: string): string {
  const categories: Record<string, string> = {
    'dashboard': 'core',
    'pets': 'core',
    'appointments': 'health',
    'expenses': 'finance',
    'reminders': 'advanced',
    'ai-vet': 'health',
    'social-profile': 'social',
    'settings': 'core',
    'admin': 'core',
    'health-tracking': 'health',
    'medications': 'health',
    'feeding-schedule': 'health',
    'activities': 'health',
    'documents': 'advanced',
    'lost-pet-alerts': 'social',
    'ai-health-insights': 'health',
    'photo-timeline': 'social',
    'weather-activity-alerts': 'health',
    'breed-specific-care': 'health',
    'emergency-contacts': 'health',
    'pet-insurance-tracker': 'finance',
    'training-progress': 'advanced',
    'multi-pet-comparison': 'advanced',
    'vet-telemedicine': 'health',
    'microchip-registry': 'advanced',
    'grooming-scheduler': 'health',
    'backup-sync': 'advanced'
  }
  
  return categories[featureName] || 'advanced'
}

function isCoreFeature(featureName: string): boolean {
  const coreFeatures = ['dashboard', 'pets', 'settings', 'admin', 'social-profile']
  return coreFeatures.includes(featureName)
}