const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...')
    
    const email = 'emalinovskis@me.com'
    const password = 'Millie1991'
    const name = 'Admin User'
    
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      console.log('ℹ️  Admin user already exists')
      console.log(`📧 Email: ${email}`)
      console.log(`👤 User ID: ${existingUser.id}`)
      return existingUser
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create the admin user
    const adminUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        isAdmin: true,
        emailVerified: new Date(), // Mark as verified
        subscriptionTier: 'lifetime',
        subscriptionStatus: 'active'
      }
    })
    
    console.log('✅ Admin user created successfully!')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Password: ${password}`)
    console.log(`👤 User ID: ${adminUser.id}`)
    
    return adminUser
  } catch (error) {
    console.error('❌ Failed to create admin user:', error)
    throw error
  }
}

// Run this script
createAdminUser()
  .then(() => {
    console.log('🎉 Admin user setup complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })