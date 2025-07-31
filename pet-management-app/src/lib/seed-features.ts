import { featureManager } from './features'

export async function seedFeatures() {
  try {
    console.log('🌱 Seeding features...')
    await featureManager.initializeFeatures()
    console.log('✅ Features seeded successfully!')
  } catch (error) {
    console.error('❌ Failed to seed features:', error)
    throw error
  }
}

// Run this script directly if called from command line
if (require.main === module) {
  seedFeatures()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}