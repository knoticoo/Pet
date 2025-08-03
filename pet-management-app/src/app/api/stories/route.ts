import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get active stories (not expired) from followed users and own stories
    const followedUsers = await prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    })

    const userIds = [userId, ...followedUsers.map(f => f.followingId)]

    const stories = await prisma.petStory.findMany({
      where: {
        userId: { in: userIds },
        expiresAt: { gt: new Date() }
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            photo: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const userId = story.userId
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: []
        }
      }
      acc[userId].stories.push({
        id: story.id,
        petId: story.petId,
        petName: story.pet.name,
        petSpecies: story.pet.species,
        imageUrl: story.imageUrl,
        caption: story.caption || '',
        viewCount: story.viewCount,
        createdAt: story.createdAt.toISOString(),
        expiresAt: story.expiresAt.toISOString()
      })
      return acc
    }, {} as Record<string, {
      user: {
        id: string;
        name: string | null;
        avatar: string | null;
      };
      stories: Array<{
        id: string;
        petId: string;
        petName: string;
        petSpecies: string;
        imageUrl: string;
        caption: string;
        viewCount: number;
        createdAt: string;
        expiresAt: string;
      }>;
    }>)

    return NextResponse.json(Object.values(groupedStories))

  } catch (error) {
    console.error('Error fetching stories:', error)
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const contentType = request.headers.get('content-type')

    let petId: string
    let caption: string
    let imageUrl: string

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()
      petId = formData.get('petId') as string
      caption = formData.get('caption') as string || ''
      const imageFile = formData.get('image') as File

      if (!imageFile || imageFile.size === 0) {
        return NextResponse.json({ error: 'No image provided' }, { status: 400 })
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(imageFile.type)) {
        return NextResponse.json({ error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' }, { status: 400 })
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (imageFile.size > maxSize) {
        return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
      }

      // For now, use a placeholder URL - in production you'd upload to cloud storage
      const timestamp = Date.now()
      imageUrl = `/api/placeholder/400/400?story=${timestamp}&filename=${encodeURIComponent(imageFile.name)}`
    } else {
      const body = await request.json()
      petId = body.petId
      caption = body.caption || ''
      imageUrl = body.imageUrl
    }

    if (!petId) {
      return NextResponse.json({ error: 'Pet ID is required' }, { status: 400 })
    }

    // Verify user owns the pet
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: userId
      }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found or access denied' }, { status: 404 })
    }

    // Create story (expires in 24 hours)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const story = await prisma.petStory.create({
      data: {
        petId,
        userId,
        imageUrl,
        caption,
        expiresAt
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            photo: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      id: story.id,
      petId: story.petId,
      petName: story.pet.name,
      petSpecies: story.pet.species,
      imageUrl: story.imageUrl,
      caption: story.caption,
      viewCount: story.viewCount,
      createdAt: story.createdAt.toISOString(),
      expiresAt: story.expiresAt.toISOString(),
      user: story.user
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating story:', error)
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 })
  }
}