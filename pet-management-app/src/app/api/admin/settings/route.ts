import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// System settings model - we'll store these in the database


export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all system settings
    const settings = await prisma.systemSetting.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { settings } = body

    // Update settings
    for (const setting of settings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          updatedAt: new Date()
        },
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description,
          category: setting.category
        }
      })
    }

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Initialize default settings if they don't exist
    const defaultSettings = [
      {
        key: 'ai_daily_limit_free',
        value: '3',
        description: 'Daily AI consultation limit for free users',
        category: 'ai_vet'
      },
      {
        key: 'ai_daily_limit_premium',
        value: '999',
        description: 'Daily AI consultation limit for premium users',
        category: 'ai_vet'
      },
      {
        key: 'premium_price_monthly',
        value: '9.99',
        description: 'Monthly premium subscription price',
        category: 'subscription'
      },
      {
        key: 'ai_enabled',
        value: 'true',
        description: 'Enable/disable AI vet consultations',
        category: 'ai_vet'
      },
      {
        key: 'max_pets_free',
        value: '5',
        description: 'Maximum pets for free users',
        category: 'limits'
      },
      {
        key: 'max_pets_premium',
        value: '999',
        description: 'Maximum pets for premium users',
        category: 'limits'
      }
    ]

    for (const setting of defaultSettings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      })
    }

    const settings = await prisma.systemSetting.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    })

    return NextResponse.json({ 
      message: 'Default settings initialized',
      settings 
    })
  } catch (error) {
    console.error('Error initializing settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}