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
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, string> = { userId: session.user.id }
    if (petId) where.petId = petId
    if (category) where.category = category

    const photos = await prisma.petPhoto.findMany({
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
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.petPhoto.count({ where })

    return NextResponse.json({
      photos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching pet photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pet photos' },
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

    const { petId, photoUrl, title, description, category, date } = await request.json()

    // Verify pet belongs to user
    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: session.user.id }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    const photo = await prisma.petPhoto.create({
      data: {
        petId,
        userId: session.user.id,
        photoUrl,
        title,
        description,
        category,
        date: date ? new Date(date) : new Date()
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

    return NextResponse.json(photo)
  } catch (error) {
    console.error('Error creating pet photo:', error)
    return NextResponse.json(
      { error: 'Failed to create pet photo' },
      { status: 500 }
    )
  }
}