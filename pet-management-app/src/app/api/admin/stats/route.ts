import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getAuthenticatedSession()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Get current date for monthly calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Parallel queries for better performance
    const [
      totalUsers,
      totalPets,
      activeFeatures,
      usersThisMonth,
      usersLastMonth,
      petsThisMonth,
      petsLastMonth,
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),
      
      // Total pets count
      prisma.pet.count({
        where: { isActive: true }
      }),
      
      // Count of enabled features
      prisma.feature.count({
        where: { isEnabled: true }
      }),
      
      // Users created this month
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Users created last month
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
      // Pets created this month
      prisma.pet.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Pets created last month
      prisma.pet.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      })
    ])

    // Calculate growth percentages
    const userGrowth = usersLastMonth > 0 
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100 
      : usersThisMonth > 0 ? 100 : 0

    const petGrowth = petsLastMonth > 0 
      ? ((petsThisMonth - petsLastMonth) / petsLastMonth) * 100 
      : petsThisMonth > 0 ? 100 : 0

    // Mock system health (in a real app, this would check database connections, API health, etc.)
    const systemHealth = 98.5

    const stats = {
      totalUsers,
      totalPets,
      activeFeatures,
      systemHealth,
      userGrowth: Math.round(userGrowth * 10) / 10, // Round to 1 decimal
      petGrowth: Math.round(petGrowth * 10) / 10,
      usersThisMonth,
      petsThisMonth
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 })
  }
}