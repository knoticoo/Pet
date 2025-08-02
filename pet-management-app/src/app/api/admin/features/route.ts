import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const features = await prisma.feature.findMany({
      orderBy: [
        { isCore: 'desc' }, // Core features first
        { category: 'asc' },
        { displayName: 'asc' }
      ]
    })

    return NextResponse.json(features)
  } catch (error) {
    console.error('Error fetching features:', error)
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, displayName, description, category, isCore = false } = body

    // Check if feature already exists
    const existingFeature = await prisma.feature.findUnique({
      where: { name }
    })

    if (existingFeature) {
      return NextResponse.json({ error: 'Feature already exists' }, { status: 400 })
    }

    const feature = await prisma.feature.create({
      data: {
        name,
        displayName,
        description,
        category,
        isCore,
        isEnabled: true
      }
    })

    return NextResponse.json(feature, { status: 201 })
  } catch (error) {
    console.error('Error creating feature:', error)
    return NextResponse.json({ error: 'Failed to create feature' }, { status: 500 })
  }
}