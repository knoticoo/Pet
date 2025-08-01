import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { aiVetService } from '@/lib/ai-vet-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { petId, symptoms, duration, photos } = body

    // Validate input
    if (!petId || !symptoms || !duration) {
      return NextResponse.json({ 
        error: 'Missing required fields: petId, symptoms, duration' 
      }, { status: 400 })
    }

    // Check if user can consult
    const { canConsult, remaining, systemStatus } = await aiVetService.canUserConsult(session.user.id)
    
    if (!canConsult) {
      return NextResponse.json({ 
        error: 'Consultation limit reached. Upgrade to premium for unlimited consultations.',
        remaining: 0,
        upgradeUrl: '/subscription/upgrade'
      }, { status: 429 })
    }

    // Get pet information
    const { prisma } = await import('@/lib/prisma')
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: session.user.id
      }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    // Calculate pet age
    const petAge = pet.birthDate ? 
      Math.floor((Date.now() - pet.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0

    // Prepare consultation input
    const consultationInput = {
      petId,
      symptoms,
      duration,
      photos: photos || [],
      petAge,
      petBreed: pet.breed || 'Mixed',
      petSpecies: pet.species
    }

    // Analyze symptoms
    const analysis = await aiVetService.analyzeSymptoms(consultationInput)

    // Save consultation
    await aiVetService.saveConsultation(session.user.id, petId, consultationInput, analysis)

    // Return analysis with usage info
    return NextResponse.json({
      analysis,
      usage: {
        remaining: remaining - 1,
        systemStatus,
        consultationId: Date.now().toString() // Simple ID for now
      }
    })

  } catch (error) {
    console.error('AI consultation error:', error)
    return NextResponse.json({ 
      error: 'Failed to analyze symptoms. Please try again.' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's consultation status
    const { canConsult, remaining, systemStatus } = await aiVetService.canUserConsult(session.user.id)
    
    // Get system health
    const systemHealth = await aiVetService.getSystemStatus()

    return NextResponse.json({
      canConsult,
      remaining,
      systemStatus,
      systemHealth,
      freeLimit: parseInt(process.env.AI_VET_FREE_LIMIT || '3'),
      premiumPrice: process.env.AI_VET_PREMIUM_PRICE || '9.99'
    })

  } catch (error) {
    console.error('Error getting consultation status:', error)
    return NextResponse.json({ 
      error: 'Failed to get consultation status' 
    }, { status: 500 })
  }
}