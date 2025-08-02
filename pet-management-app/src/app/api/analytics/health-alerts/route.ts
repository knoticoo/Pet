import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const petId = searchParams.get('petId')
    const severity = searchParams.get('severity')
    const isRead = searchParams.get('isRead')

    const where: Record<string, unknown> = {}
    if (petId) {
      // Verify pet belongs to user
      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId: session.user.id }
      })
      if (!pet) {
        return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
      }
      where.petId = petId
    }
    if (severity) where.severity = severity
    if (isRead !== null) where.isRead = isRead === 'true'

    const alerts = await prisma.healthAlert.findMany({
      where,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching health alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { petId, alertType, severity, message } = await request.json()

    // Verify pet belongs to user
    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: session.user.id }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    const alert = await prisma.healthAlert.create({
      data: {
        petId,
        alertType,
        severity,
        message
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true
          }
        }
      }
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Error creating health alert:', error)
    return NextResponse.json(
      { error: 'Failed to create health alert' },
      { status: 500 }
    )
  }
}