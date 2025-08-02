import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getSystemSetting(key: string, defaultValue: string): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    })
    return setting ? setting.value : defaultValue
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error)
    return defaultValue
  }
}

export async function GET() {
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

    // Get configurable settings
    const aiEnabled = await getSystemSetting('ai_enabled', 'true')
    const premiumPrice = await getSystemSetting('premium_price_monthly', '9.99')
    
    if (aiEnabled !== 'true') {
      return NextResponse.json({
        canUseAI: false,
        remaining: 0,
        dailyLimit: 0,
        resetTime: null,
        subscriptionTier: user.subscriptionTier || 'free',
        premiumPrice: parseFloat(premiumPrice),
        message: 'AI consultations are currently disabled'
      })
    }

    const isPremium = user.subscriptionTier === 'premium' || user.subscriptionTier === 'lifetime'
    const isActive = user.subscriptionStatus === 'active'

    // For premium users, get premium limits
    if (isPremium && isActive) {
      const premiumLimit = parseInt(await getSystemSetting('ai_daily_limit_premium', '999'))
      
      return NextResponse.json({
        canUseAI: true,
        remaining: premiumLimit,
        dailyLimit: premiumLimit,
        resetTime: null,
        subscriptionTier: user.subscriptionTier,
        premiumPrice: parseFloat(premiumPrice)
      })
    }

    // For free users, check daily limit from settings
    const dailyLimit = parseInt(await getSystemSetting('ai_daily_limit_free', '3'))
    
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

    const remaining = Math.max(0, dailyLimit - todayConsultations)
    const canUseAI = remaining > 0

    return NextResponse.json({
      canUseAI,
      remaining,
      dailyLimit,
      resetTime: tomorrow.toISOString(),
      subscriptionTier: user.subscriptionTier || 'free',
      premiumPrice: parseFloat(premiumPrice)
    })

  } catch (error) {
    console.error('Error checking AI vet status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}