import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { challengeId: string } }
) {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { challengeId } = params

    const entries = await prisma.challengeEntry.findMany({
      where: { challengeId },
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
        },
        votes: {
          where: { userId: session.user.id },
          select: { id: true }
        }
      },
      orderBy: { voteCount: 'desc' }
    })

    return NextResponse.json(entries.map(entry => ({
      id: entry.id,
      challengeId: entry.challengeId,
      petId: entry.petId,
      petName: entry.pet.name,
      petSpecies: entry.pet.species,
      imageUrl: entry.imageUrl,
      caption: entry.caption,
      voteCount: entry.voteCount,
      isWinner: entry.isWinner,
      createdAt: entry.createdAt.toISOString(),
      user: entry.user,
      hasVoted: entry.votes.length > 0
    })))

  } catch (error) {
    console.error('Error fetching challenge entries:', error)
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { challengeId: string } }
) {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { challengeId } = params
    const userId = session.user.id

    // Check if challenge exists and is active
    const challenge = await prisma.challenge.findFirst({
      where: {
        id: challengeId,
        isActive: true,
        endDate: { gt: new Date() }
      }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found or expired' }, { status: 404 })
    }

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
      imageUrl = `/api/placeholder/400/400?challenge=${challengeId}&entry=${timestamp}&filename=${encodeURIComponent(imageFile.name)}`
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

    // Check if pet already has an entry for this challenge
    const existingEntry = await prisma.challengeEntry.findFirst({
      where: {
        challengeId,
        petId
      }
    })

    if (existingEntry) {
      return NextResponse.json({ error: 'This pet already has an entry in this challenge' }, { status: 400 })
    }

    // Create challenge entry
    const entry = await prisma.challengeEntry.create({
      data: {
        challengeId,
        petId,
        userId,
        imageUrl,
        caption
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

    // Update challenge total entries
    await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        totalEntries: { increment: 1 }
      }
    })

    return NextResponse.json({
      id: entry.id,
      challengeId: entry.challengeId,
      petId: entry.petId,
      petName: entry.pet.name,
      petSpecies: entry.pet.species,
      imageUrl: entry.imageUrl,
      caption: entry.caption,
      voteCount: entry.voteCount,
      isWinner: entry.isWinner,
      createdAt: entry.createdAt.toISOString(),
      user: entry.user
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating challenge entry:', error)
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }
}