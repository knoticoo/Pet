import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
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

    const where: Record<string, string> = { userId: session.user.id }
    if (petId) where.petId = petId

    const albums = await prisma.photoAlbum.findMany({
      where,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true
          }
        },
        _count: {
          select: {
            photos: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(albums)
  } catch (error) {
    console.error('Error fetching photo albums:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photo albums' },
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

    const { petId, name, description, coverPhoto } = await request.json()

    // Verify pet belongs to user
    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: session.user.id }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    const album = await prisma.photoAlbum.create({
      data: {
        petId,
        userId: session.user.id,
        name,
        description,
        coverPhoto
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true
          }
        },
        _count: {
          select: {
            photos: true
          }
        }
      }
    })

    return NextResponse.json(album)
  } catch (error) {
    console.error('Error creating photo album:', error)
    return NextResponse.json(
      { error: 'Failed to create photo album' },
      { status: 500 }
    )
  }
}