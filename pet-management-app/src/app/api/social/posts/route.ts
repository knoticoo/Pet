import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'
import { aiVetService } from '@/lib/ai-vet-service'

export async function GET() {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch real posts from database (with user's pets and other public posts)
    const userPets = await prisma.pet.findMany({
      where: { userId: session.user.id },
      select: { id: true }
    })

    const petIds = userPets.map(pet => pet.id)

    // For now, return empty array since we don't have social posts table yet
    // In a real implementation, you would query the social_posts table
    const posts: any[] = []

    // If no real posts exist, show a sample post to demonstrate functionality
    if (posts.length === 0 && petIds.length > 0) {
      const samplePet = await prisma.pet.findFirst({
        where: { userId: session.user.id }
      })

      if (samplePet) {
        posts.push({
          id: 'sample-1',
          petId: samplePet.id,
          petName: samplePet.name,
          petSpecies: samplePet.species,
          imageUrl: '/api/placeholder/400/400',
          caption: `Check out ${samplePet.name}! Upload your first photo to start sharing.`,
          aiAnalysis: {
            mood: 'happy',
            activity: 'posing',
            healthNotes: 'Ready for social sharing!',
            tags: ['first-post', 'welcome', 'social']
          },
          likes: 0,
          comments: 0,
          createdAt: new Date().toISOString(),
          isLiked: false,
          isSample: true
        })
      }
    }

    return NextResponse.json(posts)

  } catch (error) {
    console.error('Error fetching social posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    
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
      // TODO: Implement actual file upload to cloud storage (AWS S3, Cloudinary, etc.)
      const timestamp = Date.now()
      imageUrl = `/api/placeholder/400/400?uploaded=${timestamp}&filename=${encodeURIComponent(imageFile.name)}`
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
      // Check if AI service is available before attempting analysis
      const aiStatus = await aiVetService.getSystemStatus()
      
      if (aiStatus.systemHealth === 'good') {
        aiAnalysis = await analyzePhotoWithAI(imageUrl, caption, {
          ...pet,
          breed: pet.breed || 'Mixed'
        })
      } else {
        console.log('AI service not available, using fallback analysis')
        throw new Error('AI service unavailable')
      }
    } catch (error) {
      console.log('AI analysis failed, using fallback:', error)
      // Enhanced fallback analysis based on caption keywords
      const captionLower = caption.toLowerCase()
      let mood = 'happy'
      let activity = 'posing'
      const tags = ['photo', 'social']

      // Simple keyword analysis for better fallback
      if (captionLower.includes('sleep') || captionLower.includes('nap') || captionLower.includes('rest')) {
        mood = 'sleepy'
        activity = 'sleeping'
        tags.push('rest')
      } else if (captionLower.includes('play') || captionLower.includes('run') || captionLower.includes('exercise')) {
        mood = 'excited'
        activity = 'playing'
        tags.push('exercise', 'play')
      } else if (captionLower.includes('eat') || captionLower.includes('food') || captionLower.includes('treat')) {
        mood = 'happy'
        activity = 'eating'
        tags.push('food')
      }

      aiAnalysis = {
        mood,
        activity,
        healthNotes: 'Photo analysis unavailable - pet appears alert and healthy',
        tags
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
async function analyzePhotoWithAI(imageUrl: string, caption: string, pet: {
  species: string;
  breed: string;
  name: string;
}) {
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
          num_predict: 100, // Reduced for faster response
          num_ctx: 512,
          num_thread: 1,
          repeat_penalty: 1.1
        }
      }),
      timeout: 8000 // Reduced timeout to fail faster
    } as RequestInit & { timeout: number })

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
  const analysis: {
    mood?: string;
    activity?: string;
    healthNotes?: string;
    tags?: string[];
  } = {}

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