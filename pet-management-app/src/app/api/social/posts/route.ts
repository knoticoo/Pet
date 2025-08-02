import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock data for now - in a real app, you'd fetch from database
    const mockPosts = [
      {
        id: '1',
        petId: '1',
        petName: 'Buddy',
        petSpecies: 'dog',
        imageUrl: '/api/placeholder/400/400',
        caption: 'Having a great day at the park! 🌞',
        aiAnalysis: {
          mood: 'happy',
          activity: 'playing',
          healthNotes: 'Pet appears healthy and energetic',
          tags: ['outdoor', 'exercise', 'happy']
        },
        likes: 15,
        comments: 3,
        createdAt: new Date().toISOString(),
        isLiked: false
      },
      {
        id: '2',
        petId: '2',
        petName: 'Whiskers',
        petSpecies: 'cat',
        imageUrl: '/api/placeholder/400/400',
        caption: 'Afternoon nap time 😴',
        aiAnalysis: {
          mood: 'calm',
          activity: 'sleeping',
          healthNotes: 'Relaxed posture indicates good comfort level',
          tags: ['indoor', 'rest', 'cozy']
        },
        likes: 8,
        comments: 1,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isLiked: true
      },
      {
        id: '3',
        petId: '3',
        petName: 'Chirpy',
        petSpecies: 'bird',
        imageUrl: '/api/placeholder/400/400',
        caption: 'Learning a new song! 🎵',
        aiAnalysis: {
          mood: 'curious',
          activity: 'singing',
          healthNotes: 'Active behavior suggests good health',
          tags: ['music', 'learning', 'vocal']
        },
        likes: 12,
        comments: 5,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        isLiked: false
      }
    ]

    return NextResponse.json(mockPosts)

  } catch (error) {
    console.error('Error fetching social posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { petId, caption, imageUrl } = await request.json()

    // Mock AI analysis
    const aiAnalysis = {
      mood: 'happy',
      activity: 'posing',
      healthNotes: 'Pet appears alert and healthy',
      tags: ['photo', 'social', 'memory']
    }

    const newPost = {
      id: Date.now().toString(),
      petId,
      petName: 'Pet Name', // Would fetch from database
      petSpecies: 'dog', // Would fetch from database
      imageUrl,
      caption,
      aiAnalysis,
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      isLiked: false
    }

    return NextResponse.json(newPost, { status: 201 })

  } catch (error) {
    console.error('Error creating social post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}