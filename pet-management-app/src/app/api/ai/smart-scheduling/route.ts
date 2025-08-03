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
    const days = parseInt(url.searchParams.get('days') || '7') // Schedule for next N days

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

    // Generate smart schedule using AI
    const schedule = await generateSmartSchedule(pet, days)

    // Store schedules in database
    for (const item of schedule) {
      await prisma.smartSchedule.create({
        data: {
          petId: petId,
          activityType: item.activityType,
          suggestedTime: item.suggestedTime,
          confidence: item.confidence,
          reasoning: item.reasoning
        }
      })
    }

    return NextResponse.json(schedule)

  } catch (error) {
    console.error('Error generating smart schedule:', error)
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { scheduleId, isAccepted } = body

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
    }

    // Update schedule with user feedback
    const updatedSchedule = await prisma.smartSchedule.update({
      where: { id: scheduleId },
      data: { isAccepted: isAccepted }
    })

    return NextResponse.json(updatedSchedule)

  } catch (error) {
    console.error('Error updating schedule feedback:', error)
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
  }
}

async function generateSmartSchedule(pet: { 
  id: string; 
  name: string; 
  species: string; 
  breed?: string | null; 
  birthDate?: Date | null; 
  temperament?: string | null 
}, days: number) {
  try {
    const endpoint = await aiVetService.findWorkingEndpoint()
    if (!endpoint) {
      throw new Error('AI service unavailable')
    }

    // Get historical activity data
    const historicalActivities = await prisma.activity.findMany({
      where: {
        petId: pet.id,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { date: 'desc' }
    })

    // Get behavior patterns (commented out since it's not used)
    // const behaviorData = await prisma.behaviorData.findMany({
    //   where: {
    //     petId: pet.id,
    //     timestamp: {
    //       gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // Last 14 days
    //     }
    //   },
    //   orderBy: { timestamp: 'desc' }
    // })

    // Get feeding schedules
    const feedingSchedules = await prisma.feedingSchedule.findMany({
      where: { petId: pet.id, isActive: true }
    })

    // Analyze patterns
    const walkTimes = historicalActivities
      .filter(a => a.activityType === 'walk')
      .map(a => ({
        hour: new Date(a.date).getHours(),
        day: new Date(a.date).getDay(),
        duration: a.duration || 30
      }))

    const playTimes = historicalActivities
      .filter(a => a.activityType === 'play')
      .map(a => ({
        hour: new Date(a.date).getHours(),
        day: new Date(a.date).getDay(),
        duration: a.duration || 15
      }))

    const feedingTimes = feedingSchedules.map(f => {
      const [hour, minute] = f.time.split(':').map(Number)
      return { hour, minute, type: f.mealType }
    })

    // Calculate pet age for activity level recommendations
    const ageYears = pet.birthDate 
      ? Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null

    const prompt = `You are a pet scheduling AI expert. Create an optimal daily schedule for this pet.

Pet Details:
Name: ${pet.name}
Species: ${pet.species}
Breed: ${pet.breed || 'Mixed'}
Age: ${ageYears ? `${ageYears} years old` : 'Unknown age'}
Temperament: ${pet.temperament || 'Unknown'}

Historical Patterns:
Walk Times (hour, day of week): ${walkTimes.map(w => `${w.hour}h on day ${w.day}`).join(', ') || 'No data'}
Play Times: ${playTimes.map(p => `${p.hour}h on day ${p.day}`).join(', ') || 'No data'}
Feeding Schedule: ${feedingTimes.map(f => `${f.hour}:${f.minute.toString().padStart(2, '0')} (${f.type})`).join(', ') || 'No set schedule'}

Current Time: ${new Date().getHours()}:${new Date().getMinutes()}
Day of Week: ${new Date().getDay()} (0=Sunday, 6=Saturday)

Generate a schedule for the next ${days} days. Consider:
1. Pet's historical preferences
2. Optimal times for each activity
3. Weather patterns (mornings/evenings for walks)
4. Energy levels by time of day
5. Avoiding conflicts with feeding times

Respond in this EXACT format for each day:
DAY1_WALK: [hour 0-23] | [confidence 0.0-1.0] | [reason]
DAY1_PLAY: [hour 0-23] | [confidence 0.0-1.0] | [reason]
DAY1_GROOMING: [hour 0-23] | [confidence 0.0-1.0] | [reason]

Continue for DAY2, DAY3, etc. up to DAY${days}

Example:
DAY1_WALK: 7 | 0.85 | Morning walks align with historical preference and cooler temperatures
DAY1_PLAY: 18 | 0.72 | Evening playtime after work hours when energy is high

Keep reasons brief and specific to this pet's data.`

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
          num_predict: 400,
          num_ctx: 1024
        }
      }),
      timeout: 25000
    } as RequestInit & { timeout: number })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = await response.json()
    return parseSmartSchedule(data.response, pet.name, days)

  } catch (error) {
    console.error('AI scheduling failed:', error)
    return getFallbackSchedule(pet, days)
  }
}

function parseSmartSchedule(aiResponse: string, petName: string, days: number) {
  const schedule = []
  const lines = aiResponse.split('\n')
  
  for (let day = 1; day <= days; day++) {
    const dayPrefix = `DAY${day}_`
    
    const walkLine = lines.find(line => line.trim().startsWith(`${dayPrefix}WALK:`))
    const playLine = lines.find(line => line.trim().startsWith(`${dayPrefix}PLAY:`))
    const groomingLine = lines.find(line => line.trim().startsWith(`${dayPrefix}GROOMING:`))
    
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + day - 1)
    
    if (walkLine) {
      const parts = walkLine.split('|').map(p => p.trim())
      if (parts.length >= 3) {
        const hour = parseInt(parts[0].split(':')[1]?.trim()) || 8
        const confidence = parseFloat(parts[1]) || 0.7
        const reasoning = parts[2]
        
        const suggestedTime = new Date(targetDate)
        suggestedTime.setHours(hour, 0, 0, 0)
        
        schedule.push({
          activityType: 'walk',
          suggestedTime: suggestedTime,
          confidence: Math.min(Math.max(confidence, 0), 1),
          reasoning: reasoning || `Morning walk suggested for ${petName}`
        })
      }
    }
    
    if (playLine) {
      const parts = playLine.split('|').map(p => p.trim())
      if (parts.length >= 3) {
        const hour = parseInt(parts[0].split(':')[1]?.trim()) || 18
        const confidence = parseFloat(parts[1]) || 0.7
        const reasoning = parts[2]
        
        const suggestedTime = new Date(targetDate)
        suggestedTime.setHours(hour, 0, 0, 0)
        
        schedule.push({
          activityType: 'play',
          suggestedTime: suggestedTime,
          confidence: Math.min(Math.max(confidence, 0), 1),
          reasoning: reasoning || `Playtime suggested for ${petName}`
        })
      }
    }
    
    if (groomingLine && day % 3 === 0) { // Grooming every 3 days
      const parts = groomingLine.split('|').map(p => p.trim())
      if (parts.length >= 3) {
        const hour = parseInt(parts[0].split(':')[1]?.trim()) || 14
        const confidence = parseFloat(parts[1]) || 0.6
        const reasoning = parts[2]
        
        const suggestedTime = new Date(targetDate)
        suggestedTime.setHours(hour, 0, 0, 0)
        
        schedule.push({
          activityType: 'grooming',
          suggestedTime: suggestedTime,
          confidence: Math.min(Math.max(confidence, 0), 1),
          reasoning: reasoning || `Grooming time for ${petName}`
        })
      }
    }
  }
  
  return schedule.length > 0 ? schedule : getFallbackSchedule({ name: petName }, days)
}

function getFallbackSchedule(pet: { name: string }, days: number) {
  const schedule = []
  
  for (let day = 1; day <= days; day++) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + day - 1)
    
    // Morning walk
    const walkTime = new Date(targetDate)
    walkTime.setHours(8, 0, 0, 0)
    
    schedule.push({
      activityType: 'walk',
      suggestedTime: walkTime,
      confidence: 0.6,
      reasoning: `Standard morning walk time for ${pet.name} based on common patterns`
    })
    
    // Evening play
    const playTime = new Date(targetDate)
    playTime.setHours(18, 0, 0, 0)
    
    schedule.push({
      activityType: 'play',
      suggestedTime: playTime,
      confidence: 0.6,
      reasoning: `Evening playtime for ${pet.name} when energy levels are typically high`
    })
    
    // Grooming every 3 days
    if (day % 3 === 0) {
      const groomTime = new Date(targetDate)
      groomTime.setHours(14, 0, 0, 0)
      
      schedule.push({
        activityType: 'grooming',
        suggestedTime: groomTime,
        confidence: 0.5,
        reasoning: `Regular grooming session for ${pet.name} to maintain hygiene`
      })
    }
  }
  
  return schedule
}