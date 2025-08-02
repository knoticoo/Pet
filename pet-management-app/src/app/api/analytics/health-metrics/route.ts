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
    const metricType = searchParams.get('metricType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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
    if (metricType) where.metricType = metricType
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const metrics = await prisma.healthMetric.findMany({
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
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching health metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health metrics' },
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

    const { petId, metricType, value, unit, date, notes } = await request.json()

    // Verify pet belongs to user
    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: session.user.id }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    const metric = await prisma.healthMetric.create({
      data: {
        petId,
        metricType,
        value,
        unit,
        date: date ? new Date(date) : new Date(),
        notes
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

    return NextResponse.json(metric)
  } catch (error) {
    console.error('Error creating health metric:', error)
    return NextResponse.json(
      { error: 'Failed to create health metric' },
      { status: 500 }
    )
  }
}