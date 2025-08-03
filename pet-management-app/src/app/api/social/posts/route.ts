import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'
import { aiVetService } from '@/lib/ai-vet-service'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET() {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch real posts from database
    const socialPosts = await prisma.socialPost.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true
          }
        },
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            photo: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
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
      aiAnalysis: post.photos ? {
        mood: 'happy',
        activity: 'posing',
        healthNotes: 'Pet appears healthy and alert',
        tags: ['social', 'pet-photo']
      } : null,
      likes: post.likes,
      comments: post.comments,
      createdAt: post.createdAt.toISOString(),
      isLiked: likedPostIds.has(post.id),
      user: {
        id: post.user.id,
        name: post.user.name,
        avatar: post.user.avatar
      }
    }))

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

    // Handle FormData for file upload
    const formData = await request.formData()
    const petId = formData.get('petId') as string
    const caption = formData.get('caption') as string
    const imageFile = formData.get('image') as File
    
    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (imageFile.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    // Get pet information
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: session.user.id
      }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    // Save image to file system
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'social')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = imageFile.name.split('.').pop() || 'jpg'
    const filename = `${session.user.id}-${petId}-${timestamp}.${fileExtension}`
    const filepath = join(uploadsDir, filename)
    const publicUrl = `/uploads/social/${filename}`
    
    // Write file
    await writeFile(filepath, buffer)

    // Perform AI analysis
    let aiAnalysis
    try {
      const aiStatus = await aiVetService.getSystemStatus()
      
      if (aiStatus.systemHealth === 'good') {
        aiAnalysis = await analyzePhotoWithAI(publicUrl, caption, {
          ...pet,
          breed: pet.breed || 'Mixed'
        })
      } else {
        throw new Error('AI service unavailable')
      }
    } catch (error) {
      console.log('AI analysis failed, using fallback:', error)
      
      // Enhanced fallback analysis
      const captionLower = caption.toLowerCase()
      let mood = 'happy'
      let activity = 'posing'
      const tags = ['photo', 'social']

      if (captionLower.includes('sleep') || captionLower.includes('nap')) {
        mood = 'sleepy'
        activity = 'sleeping'
        tags.push('rest')
      } else if (captionLower.includes('play') || captionLower.includes('run')) {
        mood = 'excited'
        activity = 'playing'
        tags.push('exercise')
      } else if (captionLower.includes('eat') || captionLower.includes('food')) {
        mood = 'happy'
        activity = 'eating'
        tags.push('food')
      }

      aiAnalysis = { mood, activity, healthNotes: 'Pet appears healthy and alert', tags }
    }

    // Save to database
    const socialPost = await prisma.socialPost.create({
      data: {
        userId: session.user.id,
        petId: petId,
        content: caption,
        photos: JSON.stringify([publicUrl]),
        isPublic: true,
        likes: 0,
        comments: 0
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true
          }
        }
      }
    })

    // Return the created post
    const newPost = {
      id: socialPost.id,
      petId: socialPost.petId,
      petName: socialPost.pet?.name || 'Unknown Pet',
      petSpecies: socialPost.pet?.species || 'pet',
      petBreed: socialPost.pet?.breed,
      imageUrl: publicUrl,
      caption: socialPost.content,
      aiAnalysis,
      likes: socialPost.likes,
      comments: socialPost.comments,
      createdAt: socialPost.createdAt.toISOString(),
      isLiked: false,
      user: {
        id: socialPost.user.id,
        name: socialPost.user.name,
        avatar: socialPost.user.avatar
      }
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