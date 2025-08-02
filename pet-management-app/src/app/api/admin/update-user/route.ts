import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, subscriptionTier, subscriptionStatus, isAdmin } = body

    // Update user subscription and admin status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier,
        subscriptionStatus,
        subscriptionEndsAt: subscriptionTier === 'lifetime' ? new Date('2099-12-31') : undefined,
        isAdmin,
        updatedAt: new Date()
      }
    })

    // Create or update subscription record
    if (subscriptionTier === 'lifetime') {
      await prisma.subscription.upsert({
        where: { userId },
        update: {
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date('2099-12-31'),
          cancelAtPeriodEnd: false,
          updatedAt: new Date()
        },
        create: {
          userId,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date('2099-12-31'),
          cancelAtPeriodEnd: false
        }
      })
    }

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscriptionTier: updatedUser.subscriptionTier,
        subscriptionStatus: updatedUser.subscriptionStatus,
        isAdmin: updatedUser.isAdmin
      }
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}