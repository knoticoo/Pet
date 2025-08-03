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
    const category = url.searchParams.get('category') // health, training, nutrition, behavior

    let tips = []

    if (petId) {
      // Get pet-specific tips
      const pet = await prisma.pet.findFirst({
        where: {
          id: petId,
          userId: userId
        }
      })

      if (!pet) {
        return NextResponse.json({ error: 'Pet not found or access denied' }, { status: 404 })
      }

      tips = await generatePetSpecificTips(pet, category)
    } else {
      // Get general tips for all user's pets
      const pets = await prisma.pet.findMany({
        where: { userId: userId }
      })

      for (const pet of pets) {
        const petTips = await generatePetSpecificTips(pet, category)
        tips.push(...petTips)
      }
    }

    // Store tips in database
    for (const tip of tips) {
      await prisma.personalizedTip.create({
        data: {
          userId: userId,
          petId: tip.petId,
          category: tip.category,
          title: tip.title,
          content: tip.content,
          source: 'ai_generated',
          priority: tip.priority,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
        }
      })
    }

    return NextResponse.json(tips)

  } catch (error) {
    console.error('Error generating personalized tips:', error)
    return NextResponse.json({ error: 'Failed to generate tips' }, { status: 500 })
  }
}

async function generatePetSpecificTips(pet: { 
  id: string; 
  name: string; 
  species: string; 
  breed?: string | null; 
  birthDate?: Date | null; 
  gender?: string | null; 
  weight?: number | null; 
  temperament?: string | null; 
  specialNeeds?: string | null; 
  trainingLevel?: string | null 
}, category?: string | null) {
  try {
    const endpoint = await aiVetService.findWorkingEndpoint()
    if (!endpoint) {
      throw new Error('AI service unavailable')
    }

    // Calculate pet age
    const ageYears = pet.birthDate 
      ? Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null

    // Get recent health records for context
    const recentHealth = await prisma.healthRecord.findMany({
      where: { petId: pet.id },
      orderBy: { date: 'desc' },
      take: 3
    })

    // Get recent activities for context  
    const recentActivities = await prisma.activity.findMany({
      where: { petId: pet.id },
      orderBy: { date: 'desc' },
      take: 5
    })

    const healthContext = recentHealth.map(h => `${h.title}: ${h.description || 'No details'}`).join('; ')
    const activityContext = recentActivities.map(a => `${a.activityType} for ${a.duration || 0} minutes`).join('; ')

    const categoryFilter = category ? `Focus on ${category} tips only.` : 'Cover all important aspects.'

    const prompt = `You are a professional pet care expert. Generate personalized care tips for this pet.

Pet Details:
Name: ${pet.name}
Species: ${pet.species}
Breed: ${pet.breed || 'Mixed'}
Age: ${ageYears ? `${ageYears} years old` : 'Unknown age'}
Gender: ${pet.gender || 'Unknown'}
Weight: ${pet.weight ? `${pet.weight} kg` : 'Unknown'}
Temperament: ${pet.temperament || 'Unknown'}
Special Needs: ${pet.specialNeeds || 'None'}
Training Level: ${pet.trainingLevel || 'Unknown'}

Recent Health: ${healthContext || 'No recent records'}
Recent Activities: ${activityContext || 'No recent activities'}

${categoryFilter}

Generate 3-4 specific, actionable tips. Respond in this EXACT format:

TIP1: [CATEGORY] | [TITLE] | [CONTENT] | [PRIORITY 1-5]
TIP2: [CATEGORY] | [TITLE] | [CONTENT] | [PRIORITY 1-5]
TIP3: [CATEGORY] | [TITLE] | [CONTENT] | [PRIORITY 1-5]

Categories: health, training, nutrition, behavior
Priority: 1=low, 3=medium, 5=high

Example:
TIP1: nutrition | Age-Appropriate Diet | Senior dogs need food with joint support supplements and lower calories to maintain healthy weight | 4
TIP2: health | Regular Exercise | Daily 30-minute walks help maintain cardiovascular health and joint mobility for this breed | 3

Keep content under 150 characters and make it specific to this pet's details.`

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
          num_predict: 300,
          num_ctx: 1024
        }
      }),
      timeout: 15000
    } as RequestInit & { timeout: number })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = await response.json()
    return parsePersonalizedTips(data.response, pet.id, pet.name)

  } catch (error) {
    console.error('AI tip generation failed:', error)
    return getFallbackTips(pet)
  }
}

function parsePersonalizedTips(aiResponse: string, petId: string, petName: string) {
  const tips = []
  const lines = aiResponse.split('\n')
  
  for (const line of lines) {
    const cleanLine = line.trim()
    
    if (cleanLine.match(/^TIP\d+:/)) {
      const parts = cleanLine.split('|').map(p => p.trim())
      if (parts.length >= 4) {
        const category = parts[0].split(':')[1]?.trim()
        const title = parts[1]
        const content = parts[2]
        const priority = parseInt(parts[3]) || 3
        
        if (category && title && content) {
          tips.push({
            petId: petId,
            category: category.toLowerCase(),
            title: title,
            content: content,
            priority: Math.min(Math.max(priority, 1), 5)
          })
        }
      }
    }
  }
  
  return tips.length > 0 ? tips : getFallbackTips({ id: petId, name: petName })
}

function getFallbackTips(pet: { id: string; name: string; species?: string }) {
  const tips = [
    {
      petId: pet.id,
      category: 'health',
      title: 'Regular Checkups',
      content: `Schedule annual vet checkups for ${pet.name} to catch health issues early and maintain optimal wellness.`,
      priority: 4
    },
    {
      petId: pet.id,
      category: 'nutrition',
      title: 'Proper Hydration',
      content: `Ensure ${pet.name} has access to fresh, clean water at all times. Monitor water intake for health indicators.`,
      priority: 3
    },
    {
      petId: pet.id,
      category: 'behavior',
      title: 'Mental Stimulation',
      content: `Provide ${pet.name} with puzzle toys and interactive games to prevent boredom and promote mental health.`,
      priority: 3
    }
  ]
  
  // Add species-specific tip
  if (pet.species?.toLowerCase() === 'dog') {
    tips.push({
      petId: pet.id,
      category: 'training',
      title: 'Daily Exercise',
      content: `Dogs need regular exercise. Aim for at least 30 minutes of activity daily for ${pet.name}.`,
      priority: 4
    })
  } else if (pet.species?.toLowerCase() === 'cat') {
    tips.push({
      petId: pet.id,
      category: 'behavior',
      title: 'Scratching Posts',
      content: `Provide multiple scratching posts for ${pet.name} to maintain claw health and mark territory naturally.`,
      priority: 3
    })
  }
  
  return tips
}