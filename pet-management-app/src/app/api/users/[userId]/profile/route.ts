import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const userId = params.userId

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
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get stats
    const [postsCount, petsCount, followersCount, followingCount] = await Promise.all([
      prisma.socialPost.count({ where: { userId } }),
      prisma.pet.count({ where: { userId } }),
      prisma.userFollow.count({ where: { followingId: userId } }),
      prisma.userFollow.count({ where: { followerId: userId } })
    ])

    // Check if current user is following this user
    const isFollowing = session.user.id !== userId ? await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId
        }
      }
    }) !== null : false

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      createdAt: user.createdAt.toISOString(),
      isOwnProfile: session.user.id === userId,
      isFollowing,
      stats: {
        postsCount,
        petsCount,
        followersCount,
        followingCount
      }
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}