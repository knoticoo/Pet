import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const followingId = params.userId

    if (session.user.id === followingId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Check if user exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: followingId }
    })

    if (!userToFollow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already following
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: followingId
        }
      }
    })

    if (existingFollow) {
      // Unfollow
      await prisma.userFollow.delete({
        where: { id: existingFollow.id }
      })

      return NextResponse.json({ isFollowing: false, action: 'unfollowed' })
    } else {
      // Follow
      await prisma.userFollow.create({
        data: {
          followerId: session.user.id,
          followingId: followingId
        }
      })

      return NextResponse.json({ isFollowing: true, action: 'followed' })
    }

  } catch (error) {
    console.error('Error toggling follow:', error)
    return NextResponse.json({ error: 'Failed to toggle follow' }, { status: 500 })
  }
}