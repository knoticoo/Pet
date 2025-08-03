import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const postId = params.id

    // Check if post exists
    const post = await prisma.socialPost.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId
        }
      }
    })

    if (existingLike) {
      // Unlike the post
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      })

      // Decrement likes count
      await prisma.socialPost.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } }
      })

      return NextResponse.json({ liked: false, action: 'unliked' })
    } else {
      // Like the post
      await prisma.postLike.create({
        data: {
          userId: session.user.id,
          postId: postId
        }
      })

      // Increment likes count
      await prisma.socialPost.update({
        where: { id: postId },
        data: { likes: { increment: 1 } }
      })

      return NextResponse.json({ liked: true, action: 'liked' })
    }

  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}