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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const petId = searchParams.get('petId')
    const userId = searchParams.get('userId')

    const where: any = { isPublic: true }
    if (petId) where.petId = petId
    if (userId) where.userId = userId

    const posts = await prisma.socialPost.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.socialPost.count({ where })

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching social posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social posts' },
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

    const { content, photos, petId, isPublic = true } = await request.json()

    const post = await prisma.socialPost.create({
      data: {
        userId: session.user.id,
        petId: petId || null,
        content,
        photos: photos ? JSON.stringify(photos) : null,
        isPublic
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error creating social post:', error)
    return NextResponse.json(
      { error: 'Failed to create social post' },
      { status: 500 }
    )
  }
}