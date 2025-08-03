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

    // Fetch user's social posts
    const socialPosts = await prisma.socialPost.findMany({
      where: { userId },
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
      orderBy: { createdAt: 'desc' }
    })

    // Check which posts the current user has liked
    const postIds = socialPosts.map(post => post.id)
    const userLikes = await prisma.postLike.findMany({
      where: {
        userId: session.user.id,
        postId: { in: postIds }
      },
      select: { postId: true }
    })

    const likedPostIds = new Set(userLikes.map(like => like.postId))

    // Transform to expected format
    const posts = socialPosts.map(post => ({
      id: post.id,
      petId: post.petId,
      petName: post.pet?.name || 'Unknown Pet',
      petSpecies: post.pet?.species || 'pet',
      petBreed: post.pet?.breed,
      imageUrl: post.photos ? JSON.parse(post.photos)[0] : '/images/default-pet.jpg',
      caption: post.content,
      aiAnalysis: {
        mood: 'happy',
        activity: 'posing',
        healthNotes: 'Pet appears healthy and alert',
        tags: ['social', 'pet-photo']
      },
      likes: post.likes,
      comments: post.comments,
      createdAt: post.createdAt.toISOString(),
      isLiked: likedPostIds.has(post.id)
    }))

    return NextResponse.json(posts)

  } catch (error) {
    console.error('Error fetching user posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}