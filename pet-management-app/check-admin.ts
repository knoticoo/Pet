import { prisma } from './src/lib/prisma'

async function checkAdmin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'emalinovskis@me.com' }
    })
    
    if (user) {
      console.log('✅ Admin user found:')
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   isAdmin: ${user.isAdmin}`)
      console.log(`   ID: ${user.id}`)
    } else {
      console.log('❌ Admin user not found')
    }
  } catch (error) {
    console.error('Error checking admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()