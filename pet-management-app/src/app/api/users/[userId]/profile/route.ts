import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params
    const currentUserId = session.user.id

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        location: true,
        isAdmin: true,
        subscriptionTier: true,
        createdAt: true,
        _count: {
          select: {
            pets: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if current user is following this user
    let isFollowing = false
    if (currentUserId !== userId) {
      const followRecord = await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: userId
          }
        }
      })
      isFollowing = !!followRecord
    }

    // Count user's stories (non-expired)
    const storyCount = await prisma.petStory.count({
      where: {
        pet: {
          userId: userId
        },
        expiresAt: {
          gt: new Date()
        }
      }
    })

    // Count challenges won (placeholder - you'd implement this based on your challenge system)
    const challengesWon = 0 // TODO: Implement actual challenge counting

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      isAdmin: user.isAdmin,
      subscriptionTier: user.subscriptionTier,
      joinedDate: user.createdAt.toISOString(),
      petCount: user._count.pets,
      storyCount,
      challengesWon,
      isOwnProfile: currentUserId === userId,
      isFollowing
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}