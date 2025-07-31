import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'enable-all-non-core':
        await prisma.feature.updateMany({
          where: { isCore: false },
          data: { isEnabled: true }
        })
        break

      case 'disable-all-optional':
        await prisma.feature.updateMany({
          where: { isCore: false },
          data: { isEnabled: false }
        })
        break

      case 'reset-to-defaults':
        // Enable all core features, disable all optional features
        await prisma.feature.updateMany({
          where: { isCore: true },
          data: { isEnabled: true }
        })
        await prisma.feature.updateMany({
          where: { isCore: false },
          data: { isEnabled: false }
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Return updated features count
    const enabledCount = await prisma.feature.count({
      where: { isEnabled: true }
    })

    const disabledCount = await prisma.feature.count({
      where: { isEnabled: false }
    })

    return NextResponse.json({
      success: true,
      message: `Bulk action '${action}' completed successfully`,
      enabledCount,
      disabledCount
    })
  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 })
  }
}