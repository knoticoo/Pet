import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIPetCompanion } from '@/lib/ai-pet-companion'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { interactionType } = await request.json()
    const petId = params.id

    if (!interactionType) {
      return NextResponse.json({ error: 'Interaction type is required' }, { status: 400 })
    }

    const companion = AIPetCompanion.getInstance()
    const response = await companion.interactWithPet(petId, interactionType, session.user.id)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in pet companion interaction:', error)
    return NextResponse.json(
      { error: 'Failed to interact with pet companion' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const petId = params.id
    const companion = AIPetCompanion.getInstance()
    const insights = await companion.getPetInsights(petId, session.user.id)

    if (!insights) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error('Error getting pet insights:', error)
    return NextResponse.json(
      { error: 'Failed to get pet insights' },
      { status: 500 }
    )
  }
}