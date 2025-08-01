import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      isAdmin: false,
      subscriptionTier: 'free',
      subscriptionStatus: 'active'
    }
  })

  console.log('Created user:', user)

  // Create core features
  const features = [
    { name: 'dashboard', displayName: 'Dashboard', category: 'core', isCore: true },
    { name: 'pets', displayName: 'Pet Management', category: 'core', isCore: true },
    { name: 'reminders', displayName: 'Reminders', category: 'health', isCore: false },
    { name: 'appointments', displayName: 'Appointments', category: 'health', isCore: false },
    { name: 'expenses', displayName: 'Expense Tracking', category: 'finance', isCore: false },
    { name: 'documents', displayName: 'Document Storage', category: 'core', isCore: false },
    { name: 'ai-vet', displayName: 'AI Veterinary', category: 'health', isCore: false },
    { name: 'settings', displayName: 'Settings', category: 'core', isCore: true },
    { name: 'admin', displayName: 'Admin Panel', category: 'admin', isCore: false }
  ]

  for (const feature of features) {
    await prisma.feature.upsert({
      where: { name: feature.name },
      update: {},
      create: feature
    })
  }

  console.log('Created features')

  // Enable all features for the test user
  const allFeatures = await prisma.feature.findMany()
  for (const feature of allFeatures) {
    await prisma.userFeature.upsert({
      where: {
        userId_featureId: {
          userId: user.id,
          featureId: feature.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        featureId: feature.id,
        isEnabled: true
      }
    })
  }

  console.log('Enabled features for user')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })