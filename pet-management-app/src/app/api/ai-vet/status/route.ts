import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user subscription info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isPremium = user.subscriptionTier === 'premium' || user.subscriptionTier === 'lifetime'
    const isActive = user.subscriptionStatus === 'active'

    // For premium users, return unlimited access
    if (isPremium && isActive) {
      return NextResponse.json({
        canUseAI: true,
        remaining: 999, // Unlimited
        dailyLimit: 999,
        resetTime: null,
        subscriptionTier: user.subscriptionTier,
        premiumPrice: 9.99
      })
    }

    // For free users, check daily limit (3 consultations per day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayConsultations = await prisma.aiConsultation.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    const dailyLimit = 3
    const remaining = Math.max(0, dailyLimit - todayConsultations)
    const canUseAI = remaining > 0

    return NextResponse.json({
      canUseAI,
      remaining,
      dailyLimit,
      resetTime: tomorrow.toISOString(),
      subscriptionTier: user.subscriptionTier || 'free',
      premiumPrice: 9.99
    })

  } catch (error) {
    console.error('Error checking AI vet status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}