import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'
import { aiVetService } from '@/lib/ai-vet-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const url = new URL(request.url)
    const petId = url.searchParams.get('petId')

    if (!petId) {
      return NextResponse.json({ error: 'Pet ID is required' }, { status: 400 })
    }

    // Verify user owns the pet
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: userId
      }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found or access denied' }, { status: 404 })
    }

    // Get recent behavior data for analysis
    const recentBehavior = await prisma.behaviorData.findMany({
      where: {
        petId: petId,
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    })

    // Get recent activities for context
    const recentActivities = await prisma.activity.findMany({
      where: {
        petId: petId,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { date: 'desc' },
      take: 20
    })

    // Generate AI predictions using Ollama
    const predictions = await generateBehaviorPredictions(pet, recentBehavior, recentActivities)

    // Store insights in database
    for (const prediction of predictions) {
      await prisma.behaviorInsight.create({
        data: {
          userId: userId,
          petId: petId,
          insightType: prediction.type,
          title: prediction.title,
          description: prediction.description,
          confidence: prediction.confidence,
          predictedFor: prediction.predictedFor,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
        }
      })
    }

    return NextResponse.json(predictions)

  } catch (error) {
    console.error('Error generating behavior predictions:', error)
    return NextResponse.json({ error: 'Failed to generate predictions' }, { status: 500 })
  }
}

async function generateBehaviorPredictions(
  pet: { id: string; name: string; species: string; breed?: string | null; birthDate?: Date | null; temperament?: string | null },
  behaviorData: { id: string; petId: string; dataType: string; timestamp: Date; value?: number | null }[],
  activities: { id: string; petId: string; activityType: string; date: Date; duration?: number | null }[]
) {
  try {
    const endpoint = await aiVetService.findWorkingEndpoint()
    if (!endpoint) {
      throw new Error('AI service unavailable')
    }

    // Prepare context data
    const feedingTimes = behaviorData
      .filter(b => b.dataType === 'feeding')
      .map(b => new Date(b.timestamp).getHours())
    
    const walkTimes = activities
      .filter(a => a.activityType === 'walk')
      .map(a => new Date(a.date).getHours())

    const playTimes = activities
      .filter(a => a.activityType === 'play')
      .map(a => new Date(a.date).getHours())

    const currentHour = new Date().getHours()
    const currentDay = new Date().getDay() // 0 = Sunday, 6 = Saturday

    const prompt = `You are a pet behavior AI expert. Analyze this pet's patterns and predict their needs.

Pet: ${pet.name} (${pet.species} ${pet.breed || ''})
Age: ${pet.birthDate ? Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) + ' years' : 'Unknown'}
Temperament: ${pet.temperament || 'Unknown'}

Recent Feeding Times (hours): ${feedingTimes.join(', ') || 'No data'}
Recent Walk Times (hours): ${walkTimes.join(', ') || 'No data'}  
Recent Play Times (hours): ${playTimes.join(', ') || 'No data'}

Current Time: ${currentHour}:00 (Hour ${currentHour}, Day ${currentDay})

Based on this data, predict when this pet will need:
1. Next feeding
2. Next walk  
3. Next attention/play time

Respond in this EXACT format:
FEEDING: [hour 0-23] | [confidence 0.0-1.0] | [reason]
WALKING: [hour 0-23] | [confidence 0.0-1.0] | [reason]
ATTENTION: [hour 0-23] | [confidence 0.0-1.0] | [reason]

Example:
FEEDING: 18 | 0.85 | Pet typically eats dinner around 6 PM based on pattern
WALKING: 16 | 0.72 | Afternoon walks are common for this breed
ATTENTION: 20 | 0.65 | Evening playtime matches owner's schedule

Keep reasons brief and specific.`

    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.8,
          num_predict: 200,
          num_ctx: 1024
        }
      }),
      timeout: 15000
    } as RequestInit & { timeout: number })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = await response.json()
    return parseBehaviorPredictions(data.response, pet.name)

  } catch (error) {
    console.error('AI prediction failed:', error)
    // Fallback predictions based on common pet patterns
    return getFallbackPredictions(pet)
  }
}

function parseBehaviorPredictions(aiResponse: string, petName: string) {
  const predictions = []
  const lines = aiResponse.split('\n')
  
  for (const line of lines) {
    const cleanLine = line.trim()
    
    if (cleanLine.startsWith('FEEDING:')) {
      const parts = cleanLine.substring(8).split('|').map(p => p.trim())
      if (parts.length >= 3) {
        const hour = parseInt(parts[0])
        const confidence = parseFloat(parts[1])
        const reason = parts[2]
        
        if (!isNaN(hour) && !isNaN(confidence) && hour >= 0 && hour <= 23) {
          const predictedTime = new Date()
          predictedTime.setHours(hour, 0, 0, 0)
          if (predictedTime < new Date()) {
            predictedTime.setDate(predictedTime.getDate() + 1)
          }
          
          predictions.push({
            type: 'feeding_prediction',
            title: `${petName} might be hungry soon`,
            description: `Predicted feeding time: ${hour}:00. ${reason}`,
            confidence: Math.min(Math.max(confidence, 0), 1),
            predictedFor: predictedTime
          })
        }
      }
    }
    
    if (cleanLine.startsWith('WALKING:')) {
      const parts = cleanLine.substring(8).split('|').map(p => p.trim())
      if (parts.length >= 3) {
        const hour = parseInt(parts[0])
        const confidence = parseFloat(parts[1])
        const reason = parts[2]
        
        if (!isNaN(hour) && !isNaN(confidence) && hour >= 0 && hour <= 23) {
          const predictedTime = new Date()
          predictedTime.setHours(hour, 0, 0, 0)
          if (predictedTime < new Date()) {
            predictedTime.setDate(predictedTime.getDate() + 1)
          }
          
          predictions.push({
            type: 'walk_prediction',
            title: `${petName} might need a walk`,
            description: `Predicted walk time: ${hour}:00. ${reason}`,
            confidence: Math.min(Math.max(confidence, 0), 1),
            predictedFor: predictedTime
          })
        }
      }
    }
    
    if (cleanLine.startsWith('ATTENTION:')) {
      const parts = cleanLine.substring(10).split('|').map(p => p.trim())
      if (parts.length >= 3) {
        const hour = parseInt(parts[0])
        const confidence = parseFloat(parts[1])
        const reason = parts[2]
        
        if (!isNaN(hour) && !isNaN(confidence) && hour >= 0 && hour <= 23) {
          const predictedTime = new Date()
          predictedTime.setHours(hour, 0, 0, 0)
          if (predictedTime < new Date()) {
            predictedTime.setDate(predictedTime.getDate() + 1)
          }
          
          predictions.push({
            type: 'attention_needed',
            title: `${petName} might want attention`,
            description: `Predicted attention time: ${hour}:00. ${reason}`,
            confidence: Math.min(Math.max(confidence, 0), 1),
            predictedFor: predictedTime
          })
        }
      }
    }
  }
  
  return predictions.length > 0 ? predictions : getFallbackPredictions({ name: petName })
}

function getFallbackPredictions(pet: { name: string }) {
  const currentHour = new Date().getHours()
  
  // Simple fallback based on common pet patterns
  const feedingHour = currentHour < 8 ? 8 : currentHour < 18 ? 18 : 8
  const walkHour = currentHour < 7 ? 7 : currentHour < 17 ? 17 : 7
  const attentionHour = currentHour < 20 ? 20 : 9
  
  const predictions = []
  
  const feedingTime = new Date()
  feedingTime.setHours(feedingHour, 0, 0, 0)
  if (feedingTime < new Date()) {
    feedingTime.setDate(feedingTime.getDate() + 1)
  }
  
  const walkTime = new Date()
  walkTime.setHours(walkHour, 0, 0, 0)
  if (walkTime < new Date()) {
    walkTime.setDate(walkTime.getDate() + 1)
  }
  
  const attentionTime = new Date()
  attentionTime.setHours(attentionHour, 0, 0, 0)
  if (attentionTime < new Date()) {
    attentionTime.setDate(attentionTime.getDate() + 1)
  }
  
  predictions.push(
    {
      type: 'feeding_prediction',
      title: `${pet.name} might be hungry soon`,
      description: `Predicted feeding time based on common patterns`,
      confidence: 0.6,
      predictedFor: feedingTime
    },
    {
      type: 'walk_prediction',
      title: `${pet.name} might need a walk`,
      description: `Predicted walk time based on typical schedules`,
      confidence: 0.6,
      predictedFor: walkTime
    },
    {
      type: 'attention_needed',
      title: `${pet.name} might want attention`,
      description: `Predicted attention time based on common patterns`,
      confidence: 0.6,
      predictedFor: attentionTime
    }
  )
  
  return predictions
}