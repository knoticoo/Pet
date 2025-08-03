import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const challenges = await prisma.challenge.findMany({
      where: {
        isActive: true,
        endDate: { gt: new Date() }
      },
      include: {
        entries: {
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
          orderBy: { voteCount: 'desc' },
          take: 10 // Top 10 entries
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(challenges.map(challenge => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      category: challenge.category,
      imageUrl: challenge.imageUrl,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate.toISOString(),
      isActive: challenge.isActive,
      prizeDescription: challenge.prizeDescription,
      totalEntries: challenge.totalEntries,
      totalVotes: challenge.totalVotes,
      entries: challenge.entries.map(entry => ({
        id: entry.id,
        petId: entry.petId,
        petName: entry.pet.name,
        petSpecies: entry.pet.species,
        imageUrl: entry.imageUrl,
        caption: entry.caption,
        voteCount: entry.voteCount,
        isWinner: entry.isWinner,
        createdAt: entry.createdAt.toISOString(),
        user: entry.user
      }))
    })))

  } catch (error) {
    console.error('Error fetching challenges:', error)
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    
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
    const { title, description, category, imageUrl, startDate, endDate, prizeDescription } = body

    if (!title || !description || !category || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const challenge = await prisma.challenge.create({
      data: {
        title,
        description,
        category,
        imageUrl,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        prizeDescription
      }
    })

    return NextResponse.json({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      category: challenge.category,
      imageUrl: challenge.imageUrl,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate.toISOString(),
      isActive: challenge.isActive,
      prizeDescription: challenge.prizeDescription,
      totalEntries: challenge.totalEntries,
      totalVotes: challenge.totalVotes
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating challenge:', error)
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
  }
}