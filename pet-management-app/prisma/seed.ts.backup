import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@petcare.com' },
    update: {},
    create: {
      email: 'admin@petcare.com',
      name: 'Admin User',
      password: hashedPassword,
      isAdmin: true,
    },
  })

  console.log('👤 Created admin user:', adminUser.email)

  // Create core features
  const coreFeatures = [
    {
      name: 'dashboard',
      displayName: 'Dashboard',
      description: 'Main dashboard with overview and quick actions',
      category: 'core',
      isCore: true,
      isEnabled: true,
      version: '1.0.0'
    },
    {
      name: 'pets',
      displayName: 'Pet Management',
      description: 'Add, edit, and manage pet profiles',
      category: 'core',
      isCore: true,
      isEnabled: true,
      version: '1.0.0'
    },
    {
      name: 'settings',
      displayName: 'Settings',
      description: 'User preferences and account settings',
      category: 'core',
      isCore: true,
      isEnabled: true,
      version: '1.0.0'
    },
    {
      name: 'admin',
      displayName: 'Admin Panel',
      description: 'Administrative controls and system management',
      category: 'core',
      isCore: true,
      isEnabled: true,
      version: '1.0.0'
    }
  ]

  // Create optional features
  const optionalFeatures = [
    {
      name: 'appointments',
      displayName: 'Appointments',
      description: 'Schedule and manage veterinary appointments',
      category: 'health',
      isCore: false,
      isEnabled: true,
      version: '1.0.0'
    },
    {
      name: 'reminders',
      displayName: 'Reminders',
      description: 'Set up automated reminders for pet care tasks',
      category: 'health',
      isCore: false,
      isEnabled: true,
      version: '1.0.0'
    },
    {
      name: 'expenses',
      displayName: 'Expense Tracking',
      description: 'Track and categorize pet-related expenses',
      category: 'finance',
      isCore: false,
      isEnabled: true,
      version: '1.0.0'
    },
    {
      name: 'documents',
      displayName: 'Document Storage',
      description: 'Store and organize pet documents and records',
      category: 'advanced',
      isCore: false,
      isEnabled: true,
      version: '1.0.0'
    },
    {
      name: 'health-tracking',
      displayName: 'Health Tracking',
      description: 'Monitor pet health metrics and medical history',
      category: 'health',
      isCore: false,
      isEnabled: false,
      version: '1.0.0'
    },
    {
      name: 'social-sharing',
      displayName: 'Social Sharing',
      description: 'Share pet photos and updates with friends',
      category: 'social',
      isCore: false,
      isEnabled: false,
      version: '1.0.0'
    },
    {
      name: 'insurance-tracking',
      displayName: 'Insurance Tracking',
      description: 'Manage pet insurance policies and claims',
      category: 'finance',
      isCore: false,
      isEnabled: false,
      version: '1.0.0'
    },
    {
      name: 'breeding-records',
      displayName: 'Breeding Records',
      description: 'Track breeding history and lineage',
      category: 'advanced',
      isCore: false,
      isEnabled: false,
      version: '1.0.0'
    }
  ]

  const allFeatures = [...coreFeatures, ...optionalFeatures]

  for (const feature of allFeatures) {
    await prisma.feature.upsert({
      where: { name: feature.name },
      update: {},
      create: feature,
    })
  }

  console.log(`✨ Created ${allFeatures.length} features`)

  // Create a demo regular user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@petcare.com' },
    update: {},
    create: {
      email: 'demo@petcare.com',
      name: 'Demo User',
      password: await bcrypt.hash('demo123', 10),
      isAdmin: false,
    },
  })

  console.log('👤 Created demo user:', demoUser.email)

  // Create some demo pets for the demo user
  const demoPets = [
    {
      name: 'Buddy',
      species: 'dog',
      breed: 'Golden Retriever',
      birthDate: new Date('2020-05-15'),
      description: 'Friendly and energetic golden retriever',
      userId: demoUser.id
    },
    {
      name: 'Whiskers',
      species: 'cat',
      breed: 'Persian',
      birthDate: new Date('2019-08-22'),
      description: 'Calm and fluffy Persian cat',
      userId: demoUser.id
    },
    {
      name: 'Charlie',
      species: 'dog',
      breed: 'Labrador Mix',
      birthDate: new Date('2021-03-10'),
      description: 'Playful rescue dog',
      userId: demoUser.id
    }
  ]

  for (const pet of demoPets) {
    const petId = `${pet.name.toLowerCase()}-${demoUser.id.slice(-8)}`
    await prisma.pet.upsert({
      where: { 
        id: petId
      },
      update: {},
      create: {
        ...pet,
        id: petId
      },
    })
  }

  console.log(`🐕 Created ${demoPets.length} demo pets`)

  console.log('✅ Database seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })