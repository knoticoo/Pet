import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'
import { t } from '@/lib/translations'

export async function GET() {
  try {
    const session = await getAuthenticatedSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 })
    }

    const pets = await prisma.pet.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        birthDate: true,
        description: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(pets)
  } catch (error) {
    console.error('Error fetching pets:', error)
    return NextResponse.json({ error: 'Не удалось загрузить питомцев' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 })
    }

    // Debug: Log session information
    console.log('=== PET CREATION DEBUG ===')
    console.log('Session user ID:', session.user.id)
    console.log('Session user email:', session.user.email)

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      console.error('❌ User not found in database:', session.user.id)
      return NextResponse.json({ 
        error: 'User not found in database' 
      }, { status: 401 })
    }

    console.log('✅ User found in database:', user.id, user.email)

    const body = await request.json()
    const { name, species, breed, birthDate, age, weight, color, notes } = body

    console.log('📝 Request body:', body)

    // Validate required fields
    if (!name || !species) {
      return NextResponse.json({ 
        error: 'Name and species are required' 
      }, { status: 400 })
    }

    // Calculate birth date from age if birthDate not provided
    let calculatedBirthDate = birthDate
    if (!calculatedBirthDate && age) {
      const currentYear = new Date().getFullYear()
      calculatedBirthDate = new Date(currentYear - parseInt(age), 0, 1)
    }

    // Create description from notes and additional info
    let description = notes || ''
    if (weight) {
      description += description ? `\nWeight: ${weight}` : `Weight: ${weight}`
    }
    if (color) {
      description += description ? `\nColor: ${color}` : `Color: ${color}`
    }

    const petData = {
      name: name.toString(),
      species: species.toString(),
      breed: breed?.toString() || null,
      description: description || null,
      birthDate: calculatedBirthDate ? new Date(calculatedBirthDate) : null,
      userId: session.user.id,
      isActive: true
    }

    console.log('🐾 Creating pet with data:', petData)

    const pet = await prisma.pet.create({
      data: petData
    })

    console.log('✅ Pet created successfully:', pet.id)
    return NextResponse.json(pet, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating pet:', error)
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: 'Failed to create pet', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}