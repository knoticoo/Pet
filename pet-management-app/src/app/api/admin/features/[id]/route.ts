import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const feature = await prisma.feature.findUnique({
      where: { id }
    })

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    return NextResponse.json(feature)
  } catch (error) {
    console.error('Error fetching feature:', error)
    return NextResponse.json({ error: 'Failed to fetch feature' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { displayName, description, category, isEnabled } = body

    const existingFeature = await prisma.feature.findUnique({
      where: { id }
    })

    if (!existingFeature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    // Core features cannot be disabled
    if (existingFeature.isCore && isEnabled === false) {
      return NextResponse.json({ error: 'Core features cannot be disabled' }, { status: 400 })
    }

    const feature = await prisma.feature.update({
      where: { id },
      data: {
        displayName,
        description,
        category,
        isEnabled
      }
    })

    return NextResponse.json(feature)
  } catch (error) {
    console.error('Error updating feature:', error)
    return NextResponse.json({ error: 'Failed to update feature' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const existingFeature = await prisma.feature.findUnique({
      where: { id }
    })

    if (!existingFeature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    // Core features cannot be deleted
    if (existingFeature.isCore) {
      return NextResponse.json({ error: 'Core features cannot be deleted' }, { status: 400 })
    }

    await prisma.feature.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Feature deleted successfully' })
  } catch (error) {
    console.error('Error deleting feature:', error)
    return NextResponse.json({ error: 'Failed to delete feature' }, { status: 500 })
  }
}

// PATCH route for toggling feature status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { isEnabled } = body

    const existingFeature = await prisma.feature.findUnique({
      where: { id }
    })

    if (!existingFeature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    // Core features cannot be disabled
    if (existingFeature.isCore && isEnabled === false) {
      return NextResponse.json({ error: 'Core features cannot be disabled' }, { status: 400 })
    }

    const feature = await prisma.feature.update({
      where: { id },
      data: { isEnabled }
    })

    return NextResponse.json(feature)
  } catch (error) {
    console.error('Error toggling feature:', error)
    return NextResponse.json({ error: 'Failed to toggle feature' }, { status: 500 })
  }
}