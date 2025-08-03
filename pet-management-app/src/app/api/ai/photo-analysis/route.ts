import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'
import { aiVetService } from '@/lib/ai-vet-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const contentType = request.headers.get('content-type')

    let imageUrl: string
    let analysisType: string = 'general_analysis'
    // let petId: string | null = null  // Not currently used in analysis

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()
      const imageFile = formData.get('image') as File
      analysisType = formData.get('analysisType') as string || 'general_analysis'
      // petId = formData.get('petId') as string || null  // Not currently used in analysis

      if (!imageFile || imageFile.size === 0) {
        return NextResponse.json({ error: 'No image provided' }, { status: 400 })
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(imageFile.type)) {
        return NextResponse.json({ error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' }, { status: 400 })
      }

      // Validate file size (10MB limit for analysis)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (imageFile.size > maxSize) {
        return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
      }

      // For demo purposes, use placeholder URL - in production you'd upload to cloud storage
      const timestamp = Date.now()
      imageUrl = `/api/placeholder/400/400?analysis=${timestamp}&filename=${encodeURIComponent(imageFile.name)}`
    } else {
      const body = await request.json()
      imageUrl = body.imageUrl
      analysisType = body.analysisType || 'general_analysis'
      // petId = body.petId || null  // Not currently used in analysis
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Get user's pets for identification context
    const userPets = await prisma.pet.findMany({
      where: { userId: userId },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        color: true,
        photo: true
      }
    })

    // Perform AI analysis
    const analysis = await performPhotoAnalysis(imageUrl, analysisType, userPets)

    // Store analysis results
    const photoAnalysis = await prisma.photoAnalysis.create({
      data: {
        imageUrl: imageUrl,
        petId: analysis.identifiedPetId,
        userId: userId,
        analysisType: analysisType,
        results: JSON.stringify(analysis),
        confidence: analysis.overallConfidence,
        tags: JSON.stringify(analysis.tags),
        healthFlags: JSON.stringify(analysis.healthFlags)
      }
    })

    return NextResponse.json({
      id: photoAnalysis.id,
      analysisType: analysisType,
      results: analysis,
      createdAt: photoAnalysis.createdAt.toISOString()
    })

  } catch (error) {
    console.error('Error analyzing photo:', error)
    return NextResponse.json({ error: 'Failed to analyze photo' }, { status: 500 })
  }
}

async function performPhotoAnalysis(
  imageUrl: string,
  analysisType: string,
  userPets: { id: string; name: string; species: string; breed?: string | null; color?: string | null }[]
) {
  try {
    const endpoint = await aiVetService.findWorkingEndpoint()
    if (!endpoint) {
      throw new Error('AI service unavailable')
    }

    let prompt = ''
    
    if (analysisType === 'pet_identification') {
      const petContext = userPets.map(p => 
        `ID: ${p.id}, Name: ${p.name}, Species: ${p.species}, Breed: ${p.breed || 'Mixed'}, Color: ${p.color || 'Unknown'}`
      ).join('\n')

      prompt = `You are a pet identification expert. Analyze this photo and identify which pet it shows.

User's Pets:
${petContext || 'No pets registered'}

Based on the image, identify:
1. Which specific pet this is (if any match)
2. General characteristics visible
3. Species and estimated breed
4. Physical features

Respond in this EXACT format:
IDENTIFIED_PET: [pet_id or "UNKNOWN"]
SPECIES: [dog/cat/bird/rabbit/other]
BREED: [estimated breed]
CONFIDENCE: [0.0-1.0]
FEATURES: [color], [size], [distinctive features]
REASONING: [why this identification was made]

If no pets match, use "UNKNOWN" for pet ID but still analyze the animal.`

    } else if (analysisType === 'health_check') {
      prompt = `You are a veterinary AI assistant analyzing a pet photo for potential health concerns.

Analyze this image for:
1. Visible health indicators
2. Body condition
3. Coat/skin condition  
4. Eye/nose/mouth appearance
5. Posture and mobility
6. Any concerning signs

Respond in this EXACT format:
HEALTH_STATUS: [GOOD/CONCERNING/URGENT]
BODY_CONDITION: [underweight/normal/overweight]
COAT_CONDITION: [healthy/dull/patchy/other issues]
VISIBLE_ISSUES: [list any concerns or "NONE"]
RECOMMENDATIONS: [brief recommendations]
CONFIDENCE: [0.0-1.0]
URGENCY: [1-5 scale, 5=see vet immediately]

Focus only on what's clearly visible in the photo. Don't diagnose - only note observable concerns.`

    } else {
      // General analysis
      prompt = `You are a pet behavior and wellness expert. Analyze this pet photo comprehensively.

Analyze the image for:
1. Pet species and breed characteristics
2. Emotional state and behavior
3. Environment and setting
4. General health appearance
5. Activity level indicators

Respond in this EXACT format:
SPECIES: [dog/cat/bird/rabbit/other]
BREED: [estimated breed or "mixed"]
MOOD: [happy/calm/anxious/playful/sleepy/alert]
ACTIVITY: [playing/resting/eating/grooming/exploring]
ENVIRONMENT: [indoor/outdoor/description]
HEALTH_APPEARANCE: [healthy/concerning/unknown]
TAGS: [tag1], [tag2], [tag3]
CONFIDENCE: [0.0-1.0]
NOTES: [additional observations]

Be specific and observational, avoid speculation.`
    }

    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.7,
          num_predict: 250,
          num_ctx: 1024
        }
      }),
      timeout: 20000
    } as RequestInit & { timeout: number })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = await response.json()
    return parsePhotoAnalysis(data.response, analysisType, userPets)

  } catch (error) {
    console.error('AI photo analysis failed:', error)
    return getFallbackAnalysis(analysisType)
  }
}

function parsePhotoAnalysis(aiResponse: string, analysisType: string, userPets: { id: string; name?: string }[]) {
  const lines = aiResponse.split('\n')
  const result: {
    analysisType: string;
    overallConfidence: number;
    tags: string[];
    healthFlags: string[];
    identifiedPetId: string | null;
    identifiedPetName?: string;
    species?: string;
    breed?: string;
    mood?: string;
    activity?: string;
    healthStatus?: string;
    urgency?: number;
    reasoning?: string;
    notes?: string;
  } = {
    analysisType: analysisType,
    overallConfidence: 0.7,
    tags: [],
    healthFlags: [],
    identifiedPetId: null
  }

  lines.forEach(line => {
    const cleanLine = line.trim()
    
    if (cleanLine.startsWith('IDENTIFIED_PET:')) {
      const petId = cleanLine.split(':')[1]?.trim()
      if (petId !== 'UNKNOWN' && userPets.some(p => p.id === petId)) {
        result.identifiedPetId = petId
        const pet = userPets.find(p => p.id === petId)
        result.identifiedPetName = pet?.name
      }
    } else if (cleanLine.startsWith('SPECIES:')) {
      result.species = cleanLine.split(':')[1]?.trim()
    } else if (cleanLine.startsWith('BREED:')) {
      result.breed = cleanLine.split(':')[1]?.trim()
    } else if (cleanLine.startsWith('CONFIDENCE:')) {
      result.overallConfidence = parseFloat(cleanLine.split(':')[1]?.trim()) || 0.7
    } else if (cleanLine.startsWith('MOOD:')) {
      result.mood = cleanLine.split(':')[1]?.trim()
    } else if (cleanLine.startsWith('ACTIVITY:')) {
      result.activity = cleanLine.split(':')[1]?.trim()
    } else if (cleanLine.startsWith('HEALTH_STATUS:')) {
      result.healthStatus = cleanLine.split(':')[1]?.trim()
      if (result.healthStatus !== 'GOOD') {
        result.healthFlags.push(result.healthStatus)
      }
    } else if (cleanLine.startsWith('VISIBLE_ISSUES:')) {
      const issues = cleanLine.split(':')[1]?.trim()
      if (issues && issues !== 'NONE') {
        result.healthFlags.push(...issues.split(',').map(i => i.trim()))
      }
    } else if (cleanLine.startsWith('TAGS:')) {
      const tags = cleanLine.split(':')[1]?.trim()
      if (tags) {
        result.tags = tags.split(',').map(t => t.trim()).filter(t => t)
      }
    } else if (cleanLine.startsWith('URGENCY:')) {
      result.urgency = parseInt(cleanLine.split(':')[1]?.trim()) || 1
      if (result.urgency >= 4) {
        result.healthFlags.push('HIGH_URGENCY')
      }
    } else if (cleanLine.startsWith('REASONING:')) {
      result.reasoning = cleanLine.split(':')[1]?.trim()
    } else if (cleanLine.startsWith('NOTES:')) {
      result.notes = cleanLine.split(':')[1]?.trim()
    }
  })

  return result
}

function getFallbackAnalysis(analysisType: string) {
  const baseAnalysis = {
    analysisType: analysisType,
    overallConfidence: 0.5,
    tags: ['analysis_unavailable'],
    healthFlags: [],
    identifiedPetId: null,
    species: 'unknown',
    notes: 'AI analysis temporarily unavailable - showing basic fallback results'
  }

  if (analysisType === 'health_check') {
    return {
      ...baseAnalysis,
      healthStatus: 'UNKNOWN',
      recommendations: 'AI analysis unavailable. If you have health concerns, please consult your veterinarian.',
      urgency: 1
    }
  }

  if (analysisType === 'pet_identification') {
    return {
      ...baseAnalysis,
      reasoning: 'Pet identification requires AI analysis which is currently unavailable'
    }
  }

  return {
    ...baseAnalysis,
    mood: 'unknown',
    activity: 'unknown',
    environment: 'unknown'
  }
}