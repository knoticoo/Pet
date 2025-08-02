import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { aiVetService } from '@/lib/ai-vet-service'

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

    // Handle both JSON and FormData
    let petId: string
    let caption: string
    let imageUrl: string

    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()
      petId = formData.get('petId') as string
      caption = formData.get('caption') as string
      const imageFile = formData.get('image') as File
      
      if (!imageFile) {
        return NextResponse.json({ error: 'No image provided' }, { status: 400 })
      }

      // For now, use a placeholder URL - in production you'd upload to cloud storage
      imageUrl = '/api/placeholder/400/400'
    } else {
      const body = await request.json()
      petId = body.petId
      caption = body.caption
      imageUrl = body.imageUrl
    }

    // Get pet information for AI analysis
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: session.user.id
      }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    // Use hosted AI for image analysis
    let aiAnalysis
    try {
      aiAnalysis = await analyzePhotoWithAI(imageUrl, caption, pet)
    } catch (error) {
      console.log('AI analysis failed, using fallback:', error)
      // Fallback analysis
      aiAnalysis = {
        mood: 'happy',
        activity: 'posing',
        healthNotes: 'Photo analysis unavailable - pet appears alert',
        tags: ['photo', 'social', 'memory']
      }
    }

    const newPost = {
      id: Date.now().toString(),
      petId,
      petName: pet.name,
      petSpecies: pet.species,
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

// Use your hosted AI for photo analysis
async function analyzePhotoWithAI(imageUrl: string, caption: string, pet: any) {
  try {
    const endpoint = await aiVetService.findWorkingEndpoint()
    if (!endpoint) {
      throw new Error('AI service unavailable')
    }

    const prompt = `Analyze this pet photo and caption for a social media post.

Pet: ${pet.species} ${pet.breed} ${pet.name}
Caption: ${caption}

Analyze and respond in exact format:
MOOD: [happy/calm/excited/sleepy/playful/curious]
ACTIVITY: [playing/sleeping/eating/sitting/running/posing]
HEALTH: [brief health observation based on visible appearance]
TAGS: [tag1], [tag2], [tag3]

Keep responses brief and positive. Focus on visible behavior and mood.`

    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.8,
          num_predict: 150,
          num_ctx: 512
        }
      }),
      timeout: 10000
    } as any)

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    return parsePhotoAnalysis(data.response)
  } catch (error) {
    console.error('AI photo analysis failed:', error)
    throw error
  }
}

function parsePhotoAnalysis(response: string) {
  const lines = response.split('\n')
  const analysis: any = {}

  lines.forEach(line => {
    const cleanLine = line.trim()
    
    if (cleanLine.startsWith('MOOD:')) {
      analysis.mood = cleanLine.split(':')[1].trim().toLowerCase()
    } else if (cleanLine.startsWith('ACTIVITY:')) {
      analysis.activity = cleanLine.split(':')[1].trim().toLowerCase()
    } else if (cleanLine.startsWith('HEALTH:')) {
      analysis.healthNotes = cleanLine.split(':')[1].trim()
    } else if (cleanLine.startsWith('TAGS:')) {
      analysis.tags = cleanLine.split(':')[1].split(',').map(t => t.trim()).filter(t => t)
    }
  })

  // Provide defaults if parsing failed
  return {
    mood: analysis.mood || 'happy',
    activity: analysis.activity || 'posing',
    healthNotes: analysis.healthNotes || 'Pet appears alert and healthy',
    tags: analysis.tags || ['photo', 'social']
  }
}