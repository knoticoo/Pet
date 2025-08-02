import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { t } from '@/lib/translations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 })
    }

    const body = await request.json()
    const { name, species, breed, birthDate, age, weight, color, notes } = body

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

    const pet = await prisma.pet.create({
      data: {
        name: name.toString(),
        species: species.toString(),
        breed: breed?.toString() || null,
        description: description || null,
        birthDate: calculatedBirthDate ? new Date(calculatedBirthDate) : null,
        userId: session.user.id,
        isActive: true
      }
    })

    return NextResponse.json(pet, { status: 201 })
  } catch (error) {
    console.error('Error creating pet:', error)
    return NextResponse.json({ 
      error: 'Failed to create pet', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}