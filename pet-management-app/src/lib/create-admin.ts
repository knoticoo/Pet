import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...')
    
    const email = 'malinovskis@me.com'
    const password = 'Millie1991'
    const name = 'Admin User'
    
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      console.log('ℹ️  Admin user already exists')
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
        emailVerified: new Date() // Mark as verified
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

// Run this script directly if called from command line
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('🎉 Admin user setup complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}